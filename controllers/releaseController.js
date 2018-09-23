const mongoose = require('mongoose');
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

exports.showRelease = async (releaseId, responseUrl, title) => {
  const release = await exports.getReleaseById(releaseId);
  const primaryEngineers = release.primaryEngineers.map(engineer => engineer ? engineer.name : null);
  const backupEngineers = release.backupEngineers.map(engineer => engineer ? engineer.name : null);
  const engineerOptions = await engineers.getEngineersAsOptions();
  const remainingEngineers = engineers.getEngineersLeftInPool(release, engineerOptions);

  const message = messages.displayRelease(release, primaryEngineers, backupEngineers, remainingEngineers, title);

  const slackResponse = await utils.postToSlack(responseUrl, message, true);
  return slackResponse;
};

exports.renderAddReleaseModal = async (slackReq, releaseName = null) => {
  const dialog = messages.addReleaseModal(slackReq.trigger_id, releaseName);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.renderEditReleaseModal = async (slackReq) => {
  console.log('edit release', slackReq);
  const releaseName = slackReq.original_message.attachments[0].title;
  const release = await exports.getReleaseByName(releaseName);
  const releaseDate = new Date(release.date).toLocaleDateString('en-us', { day: 'numeric', month: 'numeric',  year: '2-digit' });

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
  const updatedRelease = await Release.findOneAndUpdate(
    { _id: releaseId },
    formData,
    { new: true }
  );

  exports.showRelease(updatedRelease._id, slackReq.response_url, title);
};

// TODO: add validation so that releases can only be added in the future
exports.addRelease = async (name, date, responseUrl) => {
  const engineersAssigned = await rotation.assignEngineers(name);
  const releaseData = {
    name,
    date: new Date(`${date} ${RELEASE_START_TIME}`).toLocaleDateString('en-us', { day: 'numeric', month: 'numeric',  year: '2-digit', hour: 'numeric', minute: 'numeric' }),
    primaryEngineers: engineersAssigned.primaryEngineers.map(eng => eng ? eng.id : null),
    backupEngineers: engineersAssigned.backupEngineers.map(eng => eng ? eng.id : null),
  };
  const release = await (new Release(releaseData).save());
  const title = `Release *${releaseData.name}* added for *${releaseData.date}* :ok_hand:`;

  const slackResponse = await exports.showRelease(release.id, responseUrl, title);

  // create reminders for engineers
  const reminderText = `Release ${name} starts at 9PM. You're on call :slightly_smiling_face:`;
  const reminder = await reminders.createReminders(release.date, reminderText, [...engineersAssigned.primaryEngineers, ...engineersAssigned.backupEngineers], responseUrl);

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
  const reminderText = `Release ${releaseName} starts at 9PM. You're on call :slightly_smiling_face:`;
  const reminder = await reminders.createReminders(release.date, reminderText, [engineer], slackReq.response_url);

  exports.showRelease(release.id, slackReq.response_url, title);
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
  exports.showRelease(release._id, slackReq.response_url, title);

  // delete release reminders for these engineers
  const reminderReponse = await reminders.deleteReminders([primary, backup], release.date, slackReq.response_url);
  return;
};