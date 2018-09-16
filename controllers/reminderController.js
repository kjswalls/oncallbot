const mongoose = require('mongoose');
const utils = require('../handlers/utils');

const Reminder = mongoose.model('Reminder');
const RELEASE_REMINDER_HOUR = '20'; // 8 PM

exports.createReminder = async (date, text, user) => {
  const timestamp = new Date(date).setHours(RELEASE_REMINDER_HOUR).valueOf();
  const seconds = Math.floor(timestamp / 1000); // timestamp is in milliseconds

  const reminderInput = {
    text,
    time: seconds,
    user: user.slackId,
  };

  // as of 9/15/18 this currently fails silently if the reminder time is in the past, aka if the release is in the past
  const slackResponse = await utils.postToSlack('https://slack.com/api/reminders.add', reminderInput);

  if (slackResponse.ok) {
    const reminderData = {
      slackId: slackResponse.reminder.id,
      engineer: user.id,
      time: timestamp,
    };
  
    const reminder = await (new Reminder(reminderData).save());
    return reminder;
  }
  return;
};

exports.deleteReminder = async (id) => {
  //
};