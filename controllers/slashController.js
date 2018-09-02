const mongoose = require('mongoose');
const releases = require('../handlers/releaseMethods');
const utils = require('../handlers/utils');

const Release = mongoose.model('Release');



exports.oncall = async (req, res) => {
  res.send('');
  const slackReq = req.body;
  const releaseOptions = await releases.getReleasesAsOptions();

  const message = {
    response_type: 'in_channel',
    channel: slackReq.channel_id,
    text: 'Hello! :slightly_smiling_face:',
    attachments: [
      {
        text: 'Choose a release to view or edit',
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
      },
    ],
  };

  const slackResponse = await utils.postToSlack(slackReq.response_url, message, true);
  return slackResponse;
};
