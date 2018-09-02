const mongoose = require('mongoose');
const utils = require('./utils');
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

exports.addEngineer = async (slackReq) => {
  const releaseOptions = await releases.getReleasesAsOptions();
  const data = await utils.getFromSlack(`https://slack.com/api/users.info?token=${process.env.SLACK_ACCESS_TOKEN}&user=${slackReq.submission.slackId}`);

  console.log(data);
  const formData = {
    name: data.user.real_name,
    slackId: slackReq.submission.slackId,
    discipline: slackReq.submission.discipline,
    pod: slackReq.submission.pod,
  };
  const engineer = await (new Engineer(formData).save());

  const message = {
    response_type: 'in_channel',
    channel: slackReq.channel.id,
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

  const slackResponse = utils.postToSlack(slackReq.response_url, message);
  return slackResponse;
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
          label: 'Name',
          name: "slackId",
          type: "select",
          data_source: "users"
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

  const slackResponse = utils.postToSlack('https://slack.com/api/dialog.open', dialog);
  return slackResponse;
};