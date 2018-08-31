const releases = require('../handlers/releaseMethods');
const engineers = require('../handlers/engineerMethods');


exports.handleActions = async (req, res) => {
  const slackReq = JSON.parse(req.body.payload);
  const callbackId = slackReq.callback_id;

  // default response
  let response = {
    response_type: 'in_channel',
    channel: slackReq.channel.id,
    text: 'Oops, something went wrong',
  };

  /**
   * Different callback IDs correspond to different inputs from Slack.
   * Depending on the callback ID, we call different methods to interface
   * with the database. This is basically like a mini router, since Slack
   * hits the same POST endpoint every time with different callback IDs to
   * differentiate the different actions taken in Slack.
   **/

  switch(callbackId) {
    case 'release_selection': // release selected to view from initial menu
      res.send('');
      response = await releases.showRelease(slackReq);
      return response;

    case 'add_release_or_engineer': // either of two buttons "Add Release" or "Add Engineer" pressed
      const buttonPressed = slackReq.actions[0].value;
      if (buttonPressed === 'add_engineer') {
        res.send('');
        response = await engineers.renderAddEngineerModal(slackReq);
        return response;
      }
      if (buttonPressed === 'add_release') {
        res.send('');
        response = await releases.renderAddReleaseModal(slackReq);
        return response;;
      }
      break;
    
    case 'add_engineer_form': // "Add Engineer" form submitted
      res.send('');
      response = await engineers.addEngineer(slackReq);
      return response;
    
    case 'add_release_form': // "Add Release" form submitted
      res.send('');
      response = await releases.addRelease(slackReq);
      return response;

  }

  // if (slackReq.callback_id === 'release_selection') {
  //   response = handleReleaseSelection(slackReq);
  // } else if (slackReq.callback_id === 'add_release_or_engineer') {
  //   const buttonPressed = slackReq.actions[0].value;
  //   if (buttonPressed === 'add_engineer') {
  //     res.send('');
  //     const data = await renderAddEngineerModal(slackReq);
  //     return data;
  //   }

  //   if (buttonPressed === 'add_release') {
  //     res.send('');
  //     const data = await renderAddReleaseModal(slackReq);
  //     return data;
  //   }
  // } else if (slackReq.callback_id === 'add_engineer_form') {
  //   res.send('');
  //   const data = await addEngineer(slackReq);
  //   return data;
  // } else if (slackReq.callback_id === 'add_release_form') {
  //   res.send('');
  //   const data = await addRelease(slackReq);
  //   return data;
  // }

  return res.json(response);
};
