const mongoose = require('mongoose');
const utils = require('./utils');
const messages = require('./messages');
const engineers = require('./engineerMethods');

const Release = mongoose.model('Release');
const Engineer = mongoose.model('Engineer');

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
  // const releaseId = slackReq.actions[0].selected_options[0].value;
  const release = await exports.getReleaseById(releaseId);
  // const title = `You chose the ${release.name} release.`;

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

  const slackResponse = utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.addRelease = async (slackReq) => {
  const formData = slackReq.submission;
  const release = await (new Release(formData).save());
  const releaseOptions = await exports.getReleasesAsOptions();
  const title = `Release *${formData.name}* added for *${formData.date}* :ok_hand:`;

  const message = messages.selectRelease(releaseOptions, title);

  const slackResponse = utils.postToSlack(slackReq.response_url, message);
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