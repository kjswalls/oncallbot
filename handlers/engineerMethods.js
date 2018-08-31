const mongoose = require('mongoose');
const utils = require('./utils');
const releases = require('./releaseMethods');

const Engineer = mongoose.model('Engineer');

exports.getEngineersAsOptions = async (discipline = null) => {
  // if there's no discipline passed, just get all engineers
  let disciplineQuery = discipline ? discipline : { $exists: true };
  const engineers = await Engineer.find({ discipline: disciplineQuery });
  // if (!engineers) return [];

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

exports.addEngineer = async (slackReq) => {
  const releaseOptions = await releases.getReleasesAsOptions();
  const formData = slackReq.submission;
  const engineer = await (new Engineer(formData).save());

  const message = {
    response_type: 'in_channel',
    channel: slackReq.channel_id,
    text: `Engineer *${formData.name}* added! :ok_hand:`,
    attachments: [
      {
        text: 'Choose a release to view',
        fallback: 'You are unable to choose a release',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'release_selection',
        actions: [{
          name: 'release_select_menu',
          text: 'Choose a release...',
          type: 'select',
          options: releaseOptions,
        }],
      },
      {
        text: '',
        fallback: 'You are unable to add a release or an engineer',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'add_release_or_engineer',
        actions: [
          {
            name: 'add_release_button',
            text: 'Add a release',
            type: 'button',
            value: 'add_release',
          },
          {
            name: 'add_engineer_button',
            text: 'Add an engineer to the pool',
            type: 'button',
            value: 'add_engineer',
          },
        ],
      }
    ],
  };

  const slackResponse = utils.sendToSlack(slackReq.response_url, message);

  return slackResponse;

  // const response = await fetch(slackReq.response_url, {
  //   method: 'POST',
  //   body: JSON.stringify(message),
  //   headers: {
  //     'Content-Type': 'application/json; charset=utf-8',
  //     'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`
  //   },
  // });
  // const data = await response.json();
};

exports.renderAddEngineerModal = async (slackReq) => {
  const dialog = {
    trigger_id: slackReq.trigger_id,
    dialog: {
      callback_id: 'add_engineer_form',
      title: 'Add an engineer',
      submit_label: 'Add',
      elements: [
        {
          type: 'text',
          label: 'Name',
          name: 'name',
          placeholder: 'Kate McKinnon',
        },
        {
          type: 'select',
          label: 'Discipline',
          name: 'discipline',
          options: [
            {
              label: 'Front End',
              value: 'front_end',
            },
            {
              label: 'Back End',
              value: 'back_end',
            },
          ],
        },
        {
          type: 'select',
          label: 'Pod',
          name: 'pod',
          options: [
            {
              label: 'Consumer Tools',
              value: 'consumer_tools',
            },
            {
              label: 'Consumer Engagement',
              value: 'consumer_engagement',
            },
          ],
        },
      ],
    },
  };

  const slackResponse = utils.sendToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;

  // const response = await fetch('https://slack.com/api/dialog.open', {
  //   method: 'POST',
  //   body: JSON.stringify(dialog),
  //   headers: {
  //     'Content-Type': 'application/json; charset=utf-8',
  //     'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`
  //   },
  // });

  // const data = await response.json();
  // return data;
};

exports.getPrimaryEngineers = async (releaseId) => {
  const engineers = await Engineer
    .find({ releasePrimary: releaseId });
    // .sort({ date: 'desc' });
  // if (!engineers) return [];
  console.log(engineers);
  return engineers;
};

exports.getBackupEngineers = async (releaseId) => {
  const engineers = await Engineer
    .find({ releaseBackup: releaseId });
    // .sort({ date: 'desc' });
  // if (!engineers) return [];
  console.log(engineers);
  return engineers;
};