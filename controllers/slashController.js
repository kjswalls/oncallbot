exports.oncall = async (req, res) => {
  const slackReq = req.body;

  const response = {
    response_type: 'in_channel',
    channel: slackReq.channel_id,
    text: 'Hello :slightly_smiling_face:',
    attachments: [{
      text: 'What release are you interested in?',
      fallback: 'What release are you interested in?',
      color: '#2c963f',
      attachment_type: 'default',
      callback_id: 'release_selection',
      actions: [{
        name: 'release_select_menu',
        text: 'Choose a release...',
        type: 'select',
        options: [
          '18.9.1',
          '18.9.2',
          '18.10.1',
        ],
      }],
    }],
  };

  return res.json(response);
};
