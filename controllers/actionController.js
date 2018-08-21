exports.handleAction = async (req, res) => {
  const slackReq = JSON.parse(req.body.payload);
  // const release = slackReq.actions[0].selected_options[0].value;
  let response;
  if (slackReq.callback_id === 'report_selection') {
    response = {
      response_type: 'in_channel',
      // channel: slackReq.channel_id,
      // text: `You chose the ${release} release. On call: @kirby.walls @willem.jager`,
      text: 'You chose an option!',
    };
  }

  return res.json(response);
};
