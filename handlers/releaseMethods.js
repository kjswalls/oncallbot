const mongoose = require('mongoose');
const utils = require('./utils');
const messages = require('./messages');
const engineers = require('./engineerMethods');

const Release = mongoose.model('Release');
const Engineer = mongoose.model('Engineer');

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

  const primaryEngineers = release.primaryEngineers.map(engineer => engineer.name);
  const backupEngineers = release.backupEngineers.map(engineer => engineer.name);
  console.log('engineers on call: ', primaryEngineers);
  console.log('engineers on backup: ', backupEngineers);

  const message = messages.displayRelease(release, primaryEngineers, backupEngineers, title);

  const slackResponse = await utils.postToSlack(responseUrl, message);
  return slackResponse;
};

exports.renderAddReleaseModal = async (slackReq) => {
  const dialog = messages.addReleaseModal(slackReq.trigger_id);

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
  const formData = slackReq.submission;
  const releaseId = slackReq.state;
  const title = `Release *${slackReq.submission.name}* updated :point_up:`;
  const updatedRelease = await Release.findOneAndUpdate(
    { _id: releaseId },
    formData,
    { new: true }
  );

  exports.showRelease(updatedRelease._id, slackReq.response_url, title);
};

exports.addRelease = async (slackReq) => {
  const formData = {
    name: slackReq.submission.name,
    date: new Date(slackReq.submission.date).toLocaleDateString('en-us', { day: 'numeric', month: 'numeric',  year: '2-digit' })
  };
  const release = await (new Release(formData).save());
  const releaseOptions = await exports.getReleasesAsOptions();
  const title = `Release *${formData.name}* added for *${formData.date}* :ok_hand:`;

  const message = messages.selectRelease(releaseOptions, title);

  const slackResponse = await utils.postToSlack(slackReq.response_url, message);
  return slackResponse;
};

exports.assignEngineerToRelease = async (slackReq) => {
  const releaseName = slackReq.state;
  const id = slackReq.submission.id;
  const engineer = await Engineer.findOne({ _id: id });
  const fieldName = slackReq.submission.primary_or_backup === 'primary' ? 'primaryEngineers' : 'backupEngineers';
  const title = `You assigned *${engineer.name}* to ${releaseName} :call_me_hand:`;

  const updatedRelease = {
    [fieldName]: engineer._id,
  };
  const release = await Release.findOneAndUpdate({ name: releaseName }, { $push: updatedRelease }, { new: true }).exec();

  console.log('updated release ', release);
  console.log('slackReq', slackReq);

  exports.showRelease(release._id, slackReq.response_url, title);
};

exports.removeEngineerFromRelease = async (slackReq) => {
  const releaseName = slackReq.state;
  const { primary, backup } = slackReq.submission;
  const namesRemoved = [];
  let primaryEngineer = null;
  let backupEngineer = null;

  if (primary) {
    primaryEngineer = await Engineer.findOne({ _id: primary });
    namesRemoved.push(primaryEngineer.name)
  };
  if (backup) {
    backupEngineer = await Engineer.findOne({ _id: backup });
    namesRemoved.push(backupEngineer.name)
  };

  const release = await Release.findOneAndUpdate(
    { name: releaseName },
    { $pull: { primaryEngineers: primary, backupEngineers: backup }},
    { new: true }
  );

  const title = `*${releaseName}* has been updated :point_up: *${namesRemoved.join(', ')}* removed`;
  exports.showRelease(release._id, slackReq.response_url, title);
};