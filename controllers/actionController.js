const releases = require('./releaseController');
const engineers = require('./engineerController');
const slash = require('./slashController');


exports.handleActions = async (req, res) => {
  const slackReq = JSON.parse(req.body.payload);
  const callbackId = slackReq.callback_id;

  // default response
  let response = {
    response_type: 'in_channel',
    channel: slackReq.channel.id,
    text: 'Oops, something went wrong',
  };
  let errors = null;
  let buttonPressed = null;

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

      response = await releases.displayRelease(releaseId, responseUrl, title);
      return response;

    case 'add_release': // "Add Release" button pressed
      buttonPressed = slackReq.actions[0].value;
      if (buttonPressed === 'add_release') {
        res.send('');
        response = await releases.renderAddReleaseModal(slackReq);
        return response;
      }
    break;

    case 'back_to_select_or_manage_pool': // release selected to view from initial menu
      buttonPressed = slackReq.actions[0].value;
      if (buttonPressed === 'back_to_select') {
        res.send('');
        response = await slash.selectRelease(slackReq);
        return response;
      }
      if (buttonPressed === 'manage_pool') {
        res.send('');
        const backToRelease = slackReq.original_message.attachments[0].title;
        const manageTitle = 'Pool of engineers available for releases:';
        response = await engineers.displayPool(slackReq.response_url, backToRelease, manageTitle);
        return response;
      }
      break;
    
    case 'add_engineer_form': // "Add Engineer" form submitted
      res.send('');
      response = await engineers.addEngineer(slackReq);
      return response;

    case 'remove_engineer_from_pool_form': // "Remove Engineer From Pool" form submitted
      res.send('');
      response = await engineers.removeEngineerFromPool(slackReq);
      return response;
    
    case 'add_release_form': // "Add Release" form submitted
      // validate form data
      errors = {
        errors: releases.validateReleaseInfo(slackReq.submission)
      };

      if (errors.errors.length) {
        return res.json(errors);
      }

      res.send('');
      const name = slackReq.submission.name;
      const date = slackReq.submission.date;
      response = await releases.addRelease(name, date, slackReq.response_url);
      return response;

    case 'edit_release_or_view_history':
      buttonPressed = slackReq.actions[0].value;
      if (buttonPressed === 'edit_release') {
        res.send('');
        response = await releases.renderEditReleaseModal(slackReq);
        return response;
      }
      if (buttonPressed === 'release_history') {
        res.send('');
        const previous = slackReq.original_message.attachments[0].title;
        response = await releases.displayHistory(slackReq, previous);
        return response;
      }
      break;

    case 'add_or_remove_engineers_from_pool':
      buttonPressed = slackReq.actions[0].value;
      if (buttonPressed === 'add_engineer_to_pool') {
        res.send('');
        response = await engineers.renderAddEngineerModal(slackReq);
        return response;
      }
      if (buttonPressed === 'remove_engineer_from_pool') {
        res.send('');
        response = await engineers.renderRemoveEngineerFromPoolModal(slackReq);
        return response;
      }
      break;

    case 'back_to_release':
      res.send('');
      const attachments = slackReq.original_message.attachments;
      // get name attribute of the last attachment's button - aka release name
      const previousReleaseName = attachments[attachments.length - 1].actions[0].name;
      const previousRelease = await releases.getReleaseByName(previousReleaseName);
      const newTitle = `Viewing the *${previousReleaseName}* release.`;

      response = await releases.displayRelease(previousRelease.id, slackReq.response_url, newTitle);
      return response;

    case 'close_ephemeral':
      res.send('');
      response = await releases.deleteEphemeral(slackReq);
      return response;

    case 'assign_or_remove_engineer': // buttons for adding or removing an engineer from a release
      buttonPressed = slackReq.actions[0].value;
      if (buttonPressed === 'assign_engineer_to_release') {
        res.send('');
        response = await engineers.renderAssignEngineerModal(slackReq);
        return response;
      }
      if (buttonPressed === 'remove_engineer_from_release') {
        res.send('');
        response = await engineers.renderRemoveEngineerFromReleaseModal(slackReq);
        return response;
      }
      break;
    
    case 'assign_engineer_to_release_form': // form submitted for adding an engineer to a release
      res.send('');
      response = await releases.assignEngineerToRelease(slackReq);
      return response;

    case 'remove_engineer_from_release_form':
      if (!slackReq.submission.primary && !slackReq.submission.backup) {
        errors = {
          errors: [
            {
              name: 'primary',
              error: 'You must select at least one engineer to remove'
            },
            {
              name: 'backup',
              error: 'You must select at least one engineer to remove'
            }
          ]
        };
        return res.json(errors);
      }
      res.send('');
      response = await releases.removeEngineerFromRelease(slackReq);
      return response;

    case 'edit_release_form':
      // validate form data
      errors = {
        errors: releases.validateReleaseInfo(slackReq.submission),
      };

      if (errors.errors.length) {
        return res.json(errors);
      }

      res.send('');
      response = await releases.editRelease(slackReq);
      return response;

  }

  return res.json(response);
};
