const mongoose = require('mongoose');
const utils = require('./utils');

const Release = mongoose.model('Release');

exports.addRelease = async (slackReq) => {
  const formData = slackReq.submission;
  const release = await (new Release(formData).save());

  const message = {
    response_type: 'in_channel',
    channel: slackReq.channel_id,
    text: `Release *${formData.name}* added for *${formData.date}* :ok_hand:`,
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
          options: exports.getReleasesAsOptions(),
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
  // {
  //   type: 'select',
  //   label: 'Back End',
  //   name: 'back_end_primary',
  //   options: engineerOptions.backEnd,
  // },
  // {
  //   type: 'select',
  //   label: 'Front End',
  //   name: 'front_end_primary',
  //   options: engineerOptions.frontEnd,
  // },
}

exports.handleReleaseSelection = (slackReq) => {
  const release = slackReq.actions[0].selected_options[0].value;
  const engineersOnCall = getEngineersOnCall(release);
  const engineersOnBackup = getEngineersOnBackup(release);
  const text = `
    You chose the ${release} release.\n
    On call: ${engineersOnCall.join(', ')}\n
    Backup: ${engineersOnBackup.join(', ')}
  `;

  const response = {
    response_type: 'in_channel',
    channel: slackReq.channel.id,
    text,
  };

  return response;
};

exports.renderAddReleaseModal = async (slackReq) => {
  // const engineerOptions = await getEngineersAsOptions();
  // console.log(engineerOptions);
  const dialog = {
    trigger_id: slackReq.trigger_id,
    dialog: {
      callback_id: 'add_release_form',
      title: 'Add a new release',
      submit_label: 'Add',
      elements: [
        {
          type: 'text',
          label: 'Name',
          name: 'name',
          placeholder: 'e.g. 18.10.1',
        },
        {
          type: 'text',
          label: 'Date',
          name: 'date',
          placeholder: 'M/D/YY',
          max_length: 8,
          hint: 'The day the release goes live',
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

exports.getReleasesAsOptions = async (limit = 5) => {
  const releases = await Release
    .find()
    .limit(limit)
    .sort({ date: 'desc' });
  if (!releases) return [];

  const options = releases
    .map((release) => {
      return {
        text: release.name,
        value: release.id
      };
  });
  
  return options;
};