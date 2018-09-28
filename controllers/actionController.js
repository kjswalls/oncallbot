const releases = require('./releaseController');
const engineers = require('./engineerController');


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

    case 'edit_release_or_manage_pool':
      const editButtonPressed = slackReq.actions[0].value;
      if (editButtonPressed === 'edit_release') {
        res.send('');
        response = await releases.renderEditReleaseModal(slackReq);
        return response;
      }
      if (editButtonPressed === 'manage_pool') {
        res.send('');
        const backToRelease = slackReq.original_message.attachments[0].title;
        const manageTitle = 'Pool of engineers available for releases:';
        response = await engineers.displayPool(slackReq.response_url, backToRelease, manageTitle);
        return response;
      }
      break;

    case 'add_or_remove_engineers_from_pool':
      const manageButtonPressed = slackReq.actions[0].value;
      if (manageButtonPressed === 'add_engineer_to_pool') {
        res.send('');
        response = await engineers.renderAddEngineerModal(slackReq);
        return response;
      }
      if (manageButtonPressed === 'remove_engineer_from_pool') {
        res.send('');
        response = await engineers.renderRemoveEngineerFromPoolModal(slackReq);
        return response;
      }
      break;

    case 'back_to_release':
      res.send('');
      const previousReleaseName = slackReq.original_message.attachments[2].actions[0].name;
      const previousRelease = await releases.getReleaseByName(previousReleaseName);
      const newTitle = `Viewing the *${previousReleaseName}* release.`;

      response = await releases.showRelease(previousRelease.id, slackReq.response_url, newTitle);
      return response;

    case 'assign_or_remove_engineer': // buttons for adding or removing an engineer from a release
      const releaseButtonPressed = slackReq.actions[0].value;
      if (releaseButtonPressed === 'assign_engineer_to_release') {
        res.send('');
        response = await engineers.renderAssignEngineerModal(slackReq);
        return response;
      }
      if (releaseButtonPressed === 'remove_engineer_from_release') {
        res.send('');
        response = await engineers.renderRemoveEngineerFromReleaseModal(slackReq);
        return response;
      }
      break;
    
    case 'assign_engineer_to_release_form': // form submitted for adding an engineer to a release
      // validate form data
      // errors = {
      //   errors: await releases.validateAssignEngineer(slackReq),
      // }

      // if (errors.errors.length) {
      //   return res.json(errors);
      // }

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
