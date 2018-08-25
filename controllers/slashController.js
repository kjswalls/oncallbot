// const { getReleasesAsOptions } = require('../models/Release');

exports.oncall = async (req, res) => {
  const slackReq = req.body;

  const response = {
    response_type: 'in_channel',
    channel: slackReq.channel_id,
    text: 'Hello! :slightly_smiling_face:',
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
          // options: getReleasesAsOptions(),
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

  return res.json(response);
};
