const mongoose = require('mongoose');
const utils = require('./utils');
const messages = require('./messages');
const releases = require('./releaseMethods');

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

exports.renderAssignEngineerModal = async (slackReq) => {
  const releaseName = slackReq.original_message.attachments[0].title;
  const engineerOptions = await exports.getEngineersAsOptions();
  const engineerOptionGroups = [
    {
      "label": "Front End",
      "options": engineerOptions.frontEnd,
    },
    {
      "label": "Back End",
      "options": engineerOptions.backEnd,
    }
  ];

  const dialog = messages.assignEngineerModal(slackReq.trigger_id, releaseName, engineerOptionGroups);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.addEngineer = async (slackReq) => {
  const data = await utils.getFromSlack(`https://slack.com/api/users.info?token=${process.env.SLACK_ACCESS_TOKEN}&user=${slackReq.submission.slackId}`);

  console.log(data);
  const formData = {
    name: data.user.real_name,
    slackId: slackReq.submission.slackId,
    discipline: slackReq.submission.discipline,
    pod: slackReq.submission.pod,
  };
  const engineer = await (new Engineer(formData).save());

  const release = await releases.getReleaseByName(slackReq.state);
  const responseUrl = slackReq.response_url;
  const title = `You added *${formData.name}* to the pool :ok_hand:`;  

  return releases.showRelease(release._id, responseUrl, title);
};

exports.renderAddEngineerModal = async (slackReq) => {
  const releaseName = slackReq.original_message.attachments[0].title;
  const triggerId = slackReq.trigger_id;

  const dialog = messages.addEngineerModal(triggerId, releaseName);

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.renderRemoveEngineerModal = async(slackReq) => {
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
  const dialog = messages.removeEngineerModal(slackReq.trigger_id, releaseName, primaryEngineers, backupEngineers);

  // send the dialog to slack
  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);

  // return response (is this even necessary?)
  return slackResponse;
};