const mongoose = require('mongoose');
const utils = require('../handlers/utils');

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
  if (reminderDataObjs[0]) {
    const reminders = await Reminder.insertMany(reminderDataObjs);
    return reminders;
  }
  return;
};

exports.deleteReminder = async (id) => {
  //
};