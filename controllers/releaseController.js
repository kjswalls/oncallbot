const mongoose = require('mongoose');
const moment = require('moment-timezone');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');
const engineers = require('./engineerController');
const reminders = require('./reminderController');
const rotation = require('../handlers/rotation');

const Release = mongoose.model('Release');
const Engineer = mongoose.model('Engineer');
const RELEASE_START_TIME = '21:00'; // 9 PM

exports.validateReleaseInfo = (formData) => {
  const name = formData.name;
  const date = formData.date;
  const errors = [];

  // if date is in the past, reject it
  if (new Date(date) < Date.now()) {
    errors.push({
      name: 'date',
      error: 'Sorry, you must enter a date in the future'
    });
  }

  // validate name format
  const nameRegEx = /(^\d\d\.\d{1,2}\.\d{1}$)/;
  if (!nameRegEx.test(name)) {
    errors.push({
      name: 'name',
      error: 'Sorry, the release name must be formatted like: 18.9.1'
    });
  }

  // validate date format
  // this regex tries to match flexible date formats. m/d/yy, m/d/yyyy, mm/dd/yy, mm/dd/yyyy
  // it doesn't account for fake dates like 2/31/19 though :(
  const dateRegEx = /^([1-9]|0[1-9]|1[012])[- /.]([1-9]|0[1-9]|[12][0-9]|3[01])[- /.]((19|20)\d\d|\d\d)$/;
  if (!dateRegEx.test(date)) {
    errors.push({
      name: 'date',
      error: 'Sorry, that wasn\'t a valid date. Please use the format m/d/yy'
    });
  }

  return errors;
};

exports.getReleaseById = async (releaseId) => {
  const release = await Release.findOne({ _id: releaseId })
    .populate('primaryEngineers backupEngineers');

  return release;
};

exports.getReleaseByName = async (releaseName) => {
  const release = await Release.findOne({ name: releaseName })
    .populate('primaryEngineers backupEngineers');

  return release;
}

exports.getReleasesAsOptions = async (limit = 5) => {
  const releases = await Release
    .find()
    .limit(limit)
    .sort({ date: 'desc' });

  const options = releases
    .map((release) => {
      return {
        text: release.name,
        value: release._id
      };
  });
  
  return options;
};

exports.displayRelease = async (releaseId, responseUrl, title) => {
  const release = await exports.getReleaseById(releaseId);
  const primaryEngineers = release.primaryEngineers.map(engineer => engineer ? engineer.name : null);
  const backupEngineers = release.backupEngineers.map(engineer => engineer ? engineer.name : null);
  const engineerOptions = await engineers.getEngineersAsOptions();
  const remainingEngineers = engineers.getEngineersLeftInPool(release, engineerOptions);

  const message = messages.displayRelease(release, primaryEngineers, backupEngineers, remainingEngineers, title);

  const slackResponse = await utils.postToSlack(responseUrl, message, true);
  return slackResponse;
};

exports.displayHistory = async (slackReq, releaseName, limit = 3) => {
  const release = await exports.getReleaseByName(releaseName);
  const releases = await Release
    .find({ date: { $lt: release.date }})
    .limit(limit)
    .sort({ date: 'desc' });

  const message = messages.displayHistory(releases, releaseName, limit, slackReq.channel.id, slackReq.user.id);
  const slackResponse = await utils.postToSlack('https://slack.com/api/chat.postEphemeral', message);
  return slackResponse;
};

exports.deleteEphemeral = async (slackReq) => {
  const message = messages.deleteEphemeral();
  const slackResponse = await utils.postToSlack(slackReq.response_url, message);
  return slackResponse;
};

exports.renderAddReleaseModal = async (slackReq, releaseName = null) => {
  const dialog = messages.addReleaseModal(slackReq.trigger_id, releaseName);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.renderEditReleaseModal = async (slackReq, name = null) => {
  const releaseName = name || slackReq.original_message.attachments[0].title;
  const release = await exports.getReleaseByName(releaseName);
  const releaseDate = moment(release.date).format('M/D/YY');

  const dialog = messages.editReleaseModal(slackReq.trigger_id, releaseName, releaseDate, release._id);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.editRelease = async (slackReq) => {
  const formData = {
    name: slackReq.submission.name,
    date: `${slackReq.submission.date} ${RELEASE_START_TIME}`,
  };
  const releaseId = slackReq.state;
  const title = `Release *${slackReq.submission.name}* updated :point_up:`;
  const oldRelease = await Release.findOne({ name: slackReq.submission.name });
  const updatedRelease = await Release.findOneAndUpdate(
    { _id: releaseId },
    formData,
    { new: true }
  );

  exports.displayRelease(updatedRelease._id, slackReq.response_url, title);

  // if the date has been updated, delete and re-create all previous reminders for this release
  if (oldRelease && oldRelease.date !== updatedRelease.date) {
    const primaryEngineers = await Engineer.find({ _id: { $in: updatedRelease.primaryEngineers }});
    const backupEngineers = await Engineer.find({ _id: { $in: updatedRelease.backupEngineers }});
    const engineers = [...primaryEngineers, ...backupEngineers];
    await reminders.deleteReminders(engineers, oldRelease.date, slackReq.response_url);
    await reminders.createReminders(updatedRelease, primaryEngineers, backupEngineers, slackReq.response_url);
  }

  return;
};

exports.addRelease = async (name, date, responseUrl) => {
  const engineersAssigned = await rotation.assignEngineers(name);
  const dateString = `${date} ${RELEASE_START_TIME}`;
  const dateCalifornia = moment(dateString, 'M/D/YY HH:mm');
  const formattedDate = dateCalifornia.format('M/D/YY, h:mm A')

  const releaseData = {
    name,
    date: dateCalifornia,
    primaryEngineers: engineersAssigned.primaryEngineers.map(eng => eng ? eng.id : null),
    backupEngineers: engineersAssigned.backupEngineers.map(eng => eng ? eng.id : null),
  };
  let release = await (new Release(releaseData).save());

  let title = `Release *${releaseData.name}* added for *${formattedDate}* :ok_hand:\nUse the \`/remind list\` command to see reminders that have been set.`;
  if (!release) {
    title = `Release *${releaseData.name}* already exists.`;
    release = await Release.findOne({ name });
  }
  
  const slackResponse = await exports.displayRelease(release.id, responseUrl, title);

  // create reminders for engineers
  const reminder = await reminders.createReminders(release, engineersAssigned.primaryEngineers, engineersAssigned.backupEngineers, responseUrl);

  const updatedReleases = await rotation.updateFutureReleases(release);

  return slackResponse;
};

exports.assignEngineerToRelease = async (slackReq) => {
  const releaseName = slackReq.state;
  const id = slackReq.submission.id;
  const engineer = await Engineer.findOneAndUpdate({ _id: id }, { $inc: { weight: 1 }}, { new: true });
  const fieldName = slackReq.submission.primary_or_backup === 'primary' ? 'primaryEngineers' : 'backupEngineers';
  const title = `You assigned *${engineer.name}* to ${releaseName} :call_me_hand:\nUse the \`/remind list\` command to see reminders that have been set.`;

  const updatedRelease = {
    [fieldName]: engineer._id,
  };
  const release = await Release.findOneAndUpdate({ name: releaseName }, { $push: updatedRelease }, { new: true }).exec();

  // create a reminder for that engineer
  // const reminderText = `Release ${releaseName} starts in one hour. You're ${fieldName === 'primaryEngineers' ? 'on call' : 'a backup'} :slightly_smiling_face:`;
  const primaryArray = fieldName === 'primaryEngineers' ? [engineer] : [];
  const backupArray = fieldName === 'primaryEngineers' ? [] : [engineer];
  const reminder = await reminders.createReminders(release, primaryArray, backupArray, slackReq.response_url);

  exports.displayRelease(release.id, slackReq.response_url, title);

  const updatedReleases = await rotation.updateFutureReleases(release);
};

exports.removeEngineerFromRelease = async (slackReq) => {
  const releaseName = slackReq.state;
  const { primary, backup } = slackReq.submission;
  const namesRemoved = [];
  let primaryEngineer = null;
  let backupEngineer = null;

  if (primary) {
    // decrement weight of engineer
    primaryEngineer = await Engineer.findOneAndUpdate({ _id: primary }, { $inc: { weight: -1 }}, { new: true });
    namesRemoved.push(primaryEngineer.name)
  };
  if (backup) {
    // decrement weight of engineer
    backupEngineer = await Engineer.findOneAndUpdate({ _id: backup }, { $inc: { weight: -1 }}, { new: true });
    namesRemoved.push(backupEngineer.name)
  };

  const release = await Release.findOneAndUpdate(
    { name: releaseName },
    { $pull: { primaryEngineers: primary, backupEngineers: backup }},
    { new: true }
  );

  const title = `*${releaseName}* has been updated :point_up: *${namesRemoved.join(', ')}* removed`;
  exports.displayRelease(release._id, slackReq.response_url, title);

  // delete release reminders for these engineers
  const reminderReponse = await reminders.deleteReminders([primary, backup], release.date, slackReq.response_url);

  // update assignments to future releases
  const updatedReleases = await rotation.updateFutureReleases(release);
  return;
};

exports.removeEngineersFromRelease = async (releaseName, engineers, responseUrl) => {
  // find engineers by their slack Ids
  const slackIdRegEx = /(?<=<@)\w*(?=|)/g;
  const slackIds = engineers.match(slackIdRegEx);
  const engineerObjs = await Engineer.find({ slackId: { $in: slackIds }});
  const engIds = engineerObjs.map(eng => eng.id);

  // find engineers in primary or backup arrays, remove them
  const release = await Release.findOneAndUpdate(
    { name: releaseName },
    { $pull: { primaryEngineers: { $in: engIds }, backupEngineers: { $in: engIds }}},
    { new: true }
  );

  // find engineers and decrement their weights
  const engUpdatePromises = engIds.map(id => {
    const updatedEng = Engineer.findOneAndUpdate({ _id: id }, { $inc: { weight: -1 }}, { new: true });
    return updatedEng;
  });

  const namesRemoved = engineerObjs.map(eng => eng.name);
  const updatedEngineers = await Promise.all(engUpdatePromises);

  let title = `No engineers removed. *${namesRemoved.join(', ').length ? namesRemoved.join(', ') : 'Unknown engineer'}* not assigned to this release.`;

  if (namesRemoved.length) {
    title = `*${releaseName}* has been updated :point_up: *${namesRemoved.join(', ')}* removed`;
  }
  exports.displayRelease(release._id, responseUrl, title);

  // delete release reminders for these engineers
  const reminderReponse = await reminders.deleteReminders(engIds, release.date, responseUrl);

  // update assignments to future releases
  const updatedReleases = await rotation.updateFutureReleases(release);
  return;
};