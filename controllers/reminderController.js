const mongoose = require('mongoose');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');

const Reminder = mongoose.model('Reminder');
const RELEASE_REMINDER_HOUR = '20'; // 8 PM

exports.createReminders = async (date, text, users) => {
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

  // as of 9/15/18 this currently fails silently if the reminder time is in the past, aka if the release is in the past
  const reminderDataObjs = slackResponses.map((slackResponse, index) => {
    if (slackResponse.ok) {
      return {
        slackId: slackResponse.reminder.id,
        engineer: users[index].id,
        time: timestamp,
      };
    }
  });
  
  // if there's at least one object to insert
  if (reminderDataObjs && reminderDataObjs[0]) {
    const reminders = await Reminder.insertMany(reminderDataObjs);
    return reminders;
  }
  return;
};

exports.deleteReminders = async (engineerIds, date) => {
  const timestamp = new Date(date).setHours(RELEASE_REMINDER_HOUR).valueOf();
  let slackResponses = null;

  const reminders = await Reminder.find({ engineer: {$in: engineerIds}, time: timestamp });

  if (reminders && reminders[0]) {
    const postPromises = reminders.map((reminder) => {
      return utils.postToSlack('https://slack.com/api/reminders.delete', { reminder: reminder.slackId })
    });
    slackResponses = await Promise.all(postPromises);
  }

  // if at least one reminder was deleted from slack
  if (slackResponses && slackResponses[0].ok) {
    const deletePromises = slackResponses.map((response, index) => {
      if (response.ok) {
        return Reminder.findOneAndRemove({ _id: reminders[index].id });
      }
    });
    const deleted = await Promise.all(deletePromises);
    return deleted;
  } else {
    const message = messages.reminderError('yOLO');
    const errorResponse = await utils.postToSlack('https://slack.com/api/chat.postMessage', message);
  }

  return;
};