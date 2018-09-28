const mongoose = require('mongoose');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');
const releases = require('./releaseController');

const Engineer = mongoose.model('Engineer');

exports.getEngineersAsOptions = async (discipline = null) => {
  // if there's no discipline passed, just get all engineers
  let disciplineQuery = discipline ? discipline : { $exists: true };
  const engineers = await Engineer.find({ discipline: disciplineQuery });

  const frontEndEngineers = engineers
    .filter(engineer => engineer.discipline === 'front_end')
    .map((engineer) => {
      return {
        label: engineer.name,
        value: engineer.id
      };
  });

  const backEndEngineers = engineers
  .filter(engineer => engineer.discipline === 'back_end')
  .map((engineer) => {
    return {
      label: engineer.name,
      value: engineer.id
    };
  });

  const options = {
    frontEnd: frontEndEngineers,
    backEnd: backEndEngineers
  }

  return options;
};

exports.getEngineersLeftInPool = (release, engineerOptions) => {
  const frontEndUnique = engineerOptions.frontEnd.filter((engineerOption) => {
    const primaryIds = release.primaryEngineers.map((engineer) => engineer.id);
    const backupIds = release.backupEngineers.map((engineer) => engineer.id);
    return !(primaryIds.includes(engineerOption.value) || backupIds.includes(engineerOption.value));
  });

  const backEndUnique = engineerOptions.backEnd.filter((engineerOption) => {
    const primaryIds = release.primaryEngineers.map((engineer) => engineer.id);
    const backupIds = release.backupEngineers.map((engineer) => engineer.id);
    return !(primaryIds.includes(engineerOption.value) || backupIds.includes(engineerOption.value));
  });

  const remainingEngineers = {
    backEnd: backEndUnique,
    frontEnd: frontEndUnique,
  };
  return remainingEngineers;
};

exports.renderAssignEngineerModal = async (slackReq) => {
  console.log('from render method: ', slackReq);
  const releaseName = slackReq.original_message.attachments[0].title;
  const engineerOptions = await exports.getEngineersAsOptions();
  const release = await releases.getReleaseByName(releaseName);

  const engineersInPool = exports.getEngineersLeftInPool(release, engineerOptions);

  const dialog = messages.assignEngineerModal(slackReq.trigger_id, releaseName, engineersInPool.frontEnd, engineersInPool.backEnd);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.addEngineer = async (slackReq) => {
  const data = await utils.getFromSlack(`https://slack.com/api/users.info?token=${process.env.SLACK_ACCESS_TOKEN}&user=${slackReq.submission.slackId}`);

  const formData = {
    name: data.user.real_name,
    slackId: slackReq.submission.slackId,
    discipline: slackReq.submission.discipline,
    pod: slackReq.submission.pod,
    weight: 0,
  };
  const engineer = await (new Engineer(formData).save());

  const release = await releases.getReleaseByName(slackReq.state);
  const responseUrl = slackReq.response_url;
  const title = `You added *${formData.name}* to the pool :ok_hand:`;  

  return releases.showRelease(release._id, responseUrl, title);
};

exports.removeEngineerFromPool = async (slackReq) => {
  const removed = await Engineer.remove({ _id: slackReq.submission.id });
  const title = 'Engineer removed :wave:'
  const slackResponse = await exports.displayPool(slackReq.response_url, slackReq.state, title)
  return slackResponse;
};

exports.renderAddEngineerModal = async (slackReq) => {
  const releaseName = slackReq.original_message.attachments[0].title;
  const triggerId = slackReq.trigger_id;

  const dialog = messages.addEngineerModal(triggerId, releaseName);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.renderRemoveEngineerFromPoolModal = async (slackReq) => {
  const releaseName = slackReq.original_message.attachments[2].actions[0].name;;
  const triggerId = slackReq.trigger_id;
  const engineerOptions = await exports.getEngineersAsOptions();

  const dialog = messages.removeEngineerFromPoolModal(triggerId, releaseName, engineerOptions.frontEnd, engineerOptions.backEnd);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.renderRemoveEngineerFromReleaseModal = async (slackReq) => {
  // find the release and get engineers assigned to it
  const releaseName = slackReq.original_message.attachments[0].title;
  const release = await releases.getReleaseByName(releaseName);

  const primaryEngineers = release.primaryEngineers.map((engineer) => {
    return { label: engineer.name, value: engineer.id }
  });
  const backupEngineers = release.backupEngineers.map((engineer) => {
    return { label: engineer.name, value: engineer.id }
  });

  // pass them to messages to populate a dialog
  const dialog = messages.removeEngineerFromReleaseModal(slackReq.trigger_id, releaseName, primaryEngineers, backupEngineers);

  // send the dialog to slack
  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);

  // return response (is this even necessary?)
  return slackResponse;
};

exports.displayPool = async (responseUrl, backToRelease, title) => {
  // get all engineers from the database
  const engineers = await Engineer.find({ _id: { $exists: true }});
  const feNames = engineers
    .filter(eng => eng.discipline === 'front_end')
    .map(eng => eng.name);
  const beNames = engineers
    .filter(eng => eng.discipline === 'back_end')
    .map(eng => eng.name);

  const message = messages.displayPool(feNames, beNames, backToRelease, title);
  const slackResponse = await utils.postToSlack(responseUrl, message, true);
  return slackResponse;
};