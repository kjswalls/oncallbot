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

exports.deleteReminders = async (engineerIds, date) => {
  const timestamp = new Date(date).setHours(RELEASE_REMINDER_HOUR).valueOf();
  let slackResponses = null;

  const reminders = await Reminder.find({ engineer: {$in: engineerIds}, time: timestamp });

  if (reminders[0]) {
    const postPromises = reminders.map((reminder) => {
      return utils.postToSlack('https://slack.com/api/reminders.delete', { reminder: reminder.slackId })
    });
    slackResponses = await Promise.all(postPromises);
  }

  // if at least one reminder was deleted from slack
  if (slackResponses[0].ok) {
    const deletePromises = slackResponses.map((response, index) => {
      if (response.ok) {
        return Reminder.findOneAndRemove({ _id: reminders[index].id });
      }
    });
    const deleted = await Promise.all(deletePromises);
    return deleted;
  }
  // const deletePromises = reminders.map((reminder) => {
  //   return Reminder.findOneAndRemove({ _id: reminder.id });
  // });


  // const deletePromises = engineerIds.map((id) => {
  //   return Reminder.findOneAndRemove({ engineer: id, time: timestamp });
  // });

  // const remindersDeleted = await Promise.all(deletePromises);

  // if there was at least one reminder deleted
  // if (remindersDeleted[0]) {
  //   const postPromises = remindersDeleted.filter((reminder) => {
  //     if (reminder) {
  //       return utils.postToSlack('https://slack.com/api/reminders.delete', reminder.slackId)
  //     }
  //   });
  //   const slackResponses = await Promise.all(postPromises);
  //   return slackResponses;
  // }
};