const mongoose = require('mongoose');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');

const Reminder = mongoose.model('Reminder');
const RELEASE_REMINDER_HOUR = '20'; // 8 PM

exports.createReminders = async (date, text, users, responseUrl) => {
  const timestamp = new Date(date).setHours(RELEASE_REMINDER_HOUR).valueOf();
  const seconds = Math.floor(timestamp / 1000); // timestamp is in milliseconds

  const reminderInputs = users.map((user) => {
    return {
      text,
      time: seconds,
      user: user.slackId,
    };
  });

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
    const errorResponse = await utils.postToSlack(responseUrl, message);
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