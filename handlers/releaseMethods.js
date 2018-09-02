const mongoose = require('mongoose');
const utils = require('./utils');
const engineers = require('./engineerMethods');

const Release = mongoose.model('Release');
const Engineer = mongoose.model('Engineer');

const getRelease = async (releaseId) => {
  const release = await Release.findOne({ _id: releaseId })
    .populate('primaryEngineers backupEngineers');
  return release;
};

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

exports.showRelease = async (releaseId, channelId, responseUrl) => {
  // const releaseId = slackReq.actions[0].selected_options[0].value;
  const release = await getRelease(releaseId);

  const primaryEngineers = release.primaryEngineers.map(engineer => engineer.name);
  const backupEngineers = release.backupEngineers.map(engineer => engineer.name);
  console.log('engineers on call: ', primaryEngineers);
  console.log('engineers on backup: ', backupEngineers);

  const message = {
    response_type: 'in_channel',
    channel: channelId,
    attachments: [
      {
        fallback: `Release ${release.name} and associated engineers`,
        color: 'good',
        pretext: `You chose the ${release.name} release.`,
        title: release.name,
        text: `Go-live date: ${new Date(release.date).toLocaleDateString('en-US')}\n`,
        fields: [
            {
                title: 'On call:',
                value: `${primaryEngineers.length ? primaryEngineers.join(', ') : 'None'}\n`,
                "short": false
            },
            {
              title: 'Backup:',
              value: `${backupEngineers.length ? backupEngineers.join(', ') : 'None'}`,
              "short": false
          },
        ],
      },
      {
        text: '',
        fallback: 'You are unable to add or remove engineers',
        color: '#E8E8E8',
        attachment_type: 'default',
        callback_id: 'assign_or_remove_engineer',
        actions: [
          {
            name: 'assign_engineer_button',
            text: 'Assign engineer',
            type: 'button',
            value: 'assign_engineer_to_release',
          },
          {
            name: 'remove_engineer_button',
            text: 'Remove engineer',
            type: 'button',
            value: 'remove_engineer_from_release',
          },
        ],
      },
      {
        text: '',
        fallback: 'You are unable to edit this release or add an engineer',
        color: '#E8E8E8',
        attachment_type: 'default',
        callback_id: 'edit_release_or_add_engineer',
        actions: [
          {
            name: 'edit_release_button',
            text: 'Edit release info',
            type: 'button',
            value: 'edit_release',
          },
          {
            name: 'add_engineer_button',
            text: 'Add an engineer to the pool',
            type: 'button',
            value: 'add_engineer',
          },
        ],
      },
    ]
  };

  const slackResponse = await utils.postToSlack(responseUrl, message);
  return slackResponse;
};

exports.renderAddReleaseModal = async (slackReq) => {
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

  const slackResponse = utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.addRelease = async (slackReq) => {
  const formData = slackReq.submission;
  const release = await (new Release(formData).save());
  const releaseOptions = await exports.getReleasesAsOptions();

  const message = {
    response_type: 'in_channel',
    channel: slackReq.channel_id,
    text: `Release *${formData.name}* added for *${formData.date}* :ok_hand:`,
    attachments: [
      {
        text: 'Choose a release to view',
        fallback: 'You are unable to choose a release',
        color: 'good',
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
        fallback: 'You are unable to add a release',
        color: 'good',
        attachment_type: 'default',
        callback_id: 'add_release',
        actions: [
          {
            name: 'add_release_button',
            text: 'Add a release',
            type: 'button',
            value: 'add_release',
          },
        ],
      }
    ],
  };

  const slackResponse = utils.postToSlack(slackReq.response_url, message);
  return slackResponse;
};

exports.renderAssignEngineerModal = async (slackReq) => {
  const releaseName = slackReq.original_message.attachments[0].title;
  const engineerOptions = await engineers.getEngineersAsOptions();
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

  const dialog = {
    trigger_id: slackReq.trigger_id,
    dialog: {
      callback_id: 'assign_engineer_to_release_form',
      title: `Assign to ${releaseName}`,
      submit_label: 'Assign',
      state: releaseName,
      elements: [
        {
          label: 'Name',
          name: "id",
          type: "select",
          option_groups: engineerOptionGroups,
        },
        {
          type: 'select',
          label: 'On Call or Backup',
          name: 'primary_or_backup',
          options: [
            {
              label: 'On Call',
              value: 'primary',
            },
            {
              label: 'Backup',
              value: 'backup',
            },
          ],
        },
      ],
    },
  };

  const slackResponse = await utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};

exports.assignEngineerToRelease = async (slackReq) => {
  const releaseName = slackReq.state;
  const id = slackReq.submission.id;
  const engineer = await Engineer.findOne({ _id: id });
  const fieldName = slackReq.submission.primary_or_backup === 'primary' ? 'primaryEngineers' : 'backupEngineers';

  const updatedRelease = {
    [fieldName]: engineer._id,
  };
  const release = await Release.findOneAndUpdate({ name: releaseName }, { $push: updatedRelease }, { new: true }).exec();

  console.log('updated release ', release);
  console.log('slackReq', slackReq);

  const releaseId = release._id;
  const channelId = slackReq.channel.id;

  exports.showRelease(releaseId, channelId, slackReq.response_url);
};