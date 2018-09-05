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
      const releaseId = slackReq.actions[0].selected_options[0].value;
      const release = await releases.getReleaseById(releaseId);
      const responseUrl = slackReq.response_url;
      const title = `You chose the *${release.name}* release.`;

      response = await releases.showRelease(releaseId, responseUrl, title);
      return response;

    case 'add_release': // "Add Release" button pressed
      res.send('');
      response = await releases.renderAddReleaseModal(slackReq);
      return response;;
    
    case 'add_engineer_form': // "Add Engineer" form submitted
      res.send('');
      response = await engineers.addEngineer(slackReq);
      return response;
    
    case 'add_release_form': // "Add Release" form submitted
      res.send('');
      response = await releases.addRelease(slackReq);
      return response;

    case 'edit_release_or_add_engineer':
      const editButtonPressed = slackReq.actions[0].value;
      if (editButtonPressed === 'edit_release') {
        res.send('');
        response = await releases.renderEditReleaseModal(slackReq);
        return response;
      }
      if (editButtonPressed === 'add_engineer') {
        res.send('');
        response = await engineers.renderAddEngineerModal(slackReq);
        return response;
      }
      break;

    case 'assign_or_remove_engineer': // buttons for adding or removing an engineer from a release
      const releaseButtonPressed = slackReq.actions[0].value;
      if (releaseButtonPressed === 'assign_engineer_to_release') {
        res.send('');
        response = await engineers.renderAssignEngineerModal(slackReq);
        return response;
      }
      if (releaseButtonPressed === 'remove_engineer_from_release') {
        res.send('');
        response = await engineers.renderRemoveEngineerModal(slackReq);
        return response;
      }
      break;
    
    case 'assign_engineer_to_release_form': // form submitted for adding an engineer to a release
      res.send('');
      response = await releases.assignEngineerToRelease(slackReq);
      return response;

    case 'remove_engineer_from_release_form':
      res.send('');
      response = await releases.removeEngineerFromRelease(slackReq);
      return response;

    case 'edit_release_form':
      res.send('');
      response = await releases.editRelease(slackReq);
      return response;

  }

  return res.json(response);
};
