const mongoose = require('mongoose');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');

const Reminder = mongoose.model('Reminder');
const RELEASE_REMINDER_HOUR = '20'; // 8 PM

// as of 9/29/18 it's not currently possible to create a channel reminder via the slack API.
// I'm gonna leave this method here just in case they add that in the future, though.
exports.createChannelReminder = async (release, responseUrl, channelId) => {
  const timestamp = new Date(release.date).setHours(RELEASE_REMINDER_HOUR).valueOf();
  const seconds = Math.floor(timestamp / 1000); // timestamp is in milliseconds
  const primaryAtMentions = release.primaryEngineers.map(eng => `<@${eng.slackId}>`);
  const backupAtMentions = release.backupEngineers.map(eng => `<@${eng.slackId}>`);

  const text = `#${channelId} Release ${release.name} starts in one hour! ${primaryAtMentions.join(' ')} you're on call. ${backupAtMentions.join(' ')} you're on backup. :slightly_smiling_face:`;

  const reminderInput = {
    text,
    time: seconds,
    user: channelId,
  };

  const slackResponse = await utils.postToSlack('https://slack.com/api/reminders.add', reminderInput);
  return slackResponse;
};

exports.createReminders = async (release, primaries, backups, responseUrl) => {
  const timestamp = new Date(release.date).setHours(RELEASE_REMINDER_HOUR).valueOf();
  const seconds = Math.floor(timestamp / 1000); // timestamp is in milliseconds
  const primaryText = `Release ${release.name} starts in one hour. You're *on call* :slightly_smiling_face:`;
  const backupText = `Release ${release.name} starts in one hour. You're on *backup* :slightly_smiling_face:`;
  let users = [...primaries ? primaries : [], ...backups ? backups : []];
  let primaryInputs = [];
  let backupInputs = [];

  if (primaries) {
    primaryInputs = primaries.map(eng => {
      return {
        text: primaryText,
        time: seconds,
        user: eng.slackId,
      };
    });
  }

  if (backups) {
    backupInputs = backups.map(eng => {
      return {
        text: backupText,
        time: seconds,
        user: eng.slackId,
      };
    });
  }

  // const reminderInputs = users.map((user) => {
  //   return {
  //     text,
  //     time: seconds,
  //     user: user.slackId,
  //   };
  // });

  const reminderInputs = [...primaryInputs, ...backupInputs];

  const postPromises = reminderInputs.map((reminderInput) => utils.postToSlack('https://slack.com/api/reminders.add', reminderInput));
  const slackResponses = await Promise.all(postPromises);
  let reminderDataObjs = [];

  // if at least one slack request succeeded
  if (slackResponses && slackResponses.some(response => response.ok)) {
    reminderDataObjs = slackResponses
      .filter(response => response.ok)
      .map((slackResponse, index) => {
      return {
        slackId: slackResponse.reminder.id,
        engineer: users[index].id,
        time: timestamp,
      };
    });
  } else {
    // if NO slack reminders were created successfully
    let reason = '';
    // try to send helpful error messages
    if (slackResponses && slackResponses[0].error) {
      reason = `Error: ${slackResponses[0].error}`;
    }
    const message = messages.createReminderError(reason);
    console.log('create reminder error', slackResponses);
    const errorResponse = await utils.postToSlack(responseUrl, message, true);
  }

  
  // if there's at least one object to insert
  if (reminderDataObjs.length && reminderDataObjs.some(obj => obj !== null)) {
    const filtered = reminderDataObjs.filter(obj => obj !== null);
    let reminders = null;
    try {
      reminders = await Reminder.insertMany(filtered);
    } catch (e) {
      const reason = `Error: ${e}`;
      const message = messages.createReminderError(reason);
      console.log('error adding reminder to the database: ', e);
      const errorResponse = await utils.postToSlack(responseUrl, message, true);
    }
    return reminders;
  }
  return;
};

exports.deleteReminders = async (engineerIds, date, responseUrl) => {
  const timestamp = new Date(date).setHours(RELEASE_REMINDER_HOUR).valueOf(); // valueOf returns date value in milliseconds
  let slackResponses = null;

  const reminders = await Reminder.find({ engineer: {$in: engineerIds}, time: timestamp });

  // if there were any reminders for those engineers/releases in the database, delete from slack
  if (reminders.length && reminders.some(reminder => reminder !== null)) {
    const filtered = reminders.filter(reminder => reminder !== null);
    const postPromises = filtered.map((reminder) => {
      return utils.postToSlack('https://slack.com/api/reminders.delete', { reminder: reminder.slackId })
    });
    slackResponses = await Promise.all(postPromises);
  }

  // if at least one reminder was deleted from slack, delete from the database
  if (slackResponses && slackResponses[0].ok) {
    const deletePromises = slackResponses.map((response, index) => {
      if (response.ok) {
        return Reminder.findOneAndRemove({ _id: reminders[index].id });
      }
    });
    const deleted = await Promise.all(deletePromises);
    return deleted;
  } else {
    let reason = 'The reminder may not have ever been created.\nUse the `/remind list` command to check.';
    // try to send helpful error messages
    if (slackResponses && slackResponses[0].error) {
      reason = `Error: ${slackResponses[0].error}`;
    }
    const message = messages.deleteReminderError(reason);
    console.log('delete reminder error: ', slackResponses);
    const errorResponse = await utils.postToSlack(responseUrl, message);
  }

  return;
};