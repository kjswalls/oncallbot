const mongoose = require('mongoose');
const releases = require('./releaseController');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');

const Release = mongoose.model('Release');

exports.oncall = async (req, res) => {
  res.send('');
  const slackReq = req.body;
  let slackResponse = null;
  const text = slackReq.text;
  console.log('command text: ', text);

  // `/oncall 18.9.1`
  const releaseNameRegEx = /(^\d\d\.\d{1,2}\.\d{1}$)/;

  // `/oncall 18.9.1 -o <@U7WQ2BVNK|kjswalls> -b <@U7WQ2BVNK|wjager>`
  const assignEngineersRegEx = /(^\d\d\.\d{1,2}\.\d{1}) (-[ob]) ((<@(\w+)(\|(\w+))?>)(( (<@)(\w+)(\|(\w+))?>)*))( (-[ob]) ((<@(\w+)(\|(\w+))?>)(( (<@)(\w+)(\|(\w+))?>)*)))?/;
  
  // `/oncall 18.9.1 9/7/18`
  const addReleaseRegEx = /(\d\d\.\d{1,2}\.\d{1})( ([1-9]|0[1-9]|1[012])[- /.]([1-9]|0[1-9]|[12][0-9]|3[01])[- /.]((19|20)\d\d|\d\d))/;

  if (text === '') { // select a release: `/oncall`
    slackResponse = await exports.selectRelease(slackReq);
    return slackResponse;

  } else if (releaseNameRegEx.test(text)) { // view release info: `/oncall 18.9.1`
      console.log('NAME regex matched');
      const matches = releaseNameRegEx.exec(text);
      const releaseName = matches[0];
      const release = await releases.getReleaseByName(releaseName);

      // if release doesn't exist, open dialog for adding release
      if (!release) {
        slackResponse = await releases.renderAddReleaseModal(slackReq, releaseName);
        return slackResponse;

        // otherwise, show release info
      } else {
        const releaseId = release._id;
        const responseUrl = slackReq.response_url;
        const title = `You chose the *${releaseName}* release.`;
  
        slackResponse = await releases.showRelease(releaseId, slackReq.response_url, title);
        return slackResponse;
      }


  } else if (assignEngineersRegEx.test(text)) { // assign people to release: `/oncall 18.9.1 -o @willem.jager -b @hai.phan`
      console.log('ASSIGN regex matched');
      const matches = assignEngineersRegEx.exec(text);
      // const slackIdRegEx = /((<@(\w+)(\|(\w+))?>) ?)/g;
      const slackIdRegEx = /(?<=<@)\w*(?=|)/g;
      const releaseName = matches[1];
      const onCall = matches[3];
      const backup = matches[16];
      const release = await releases.getReleaseByName(releaseName);

      // if release doesn't exist, open dialog for adding release
      if (!release) {
        slackResponse = await releases.renderAddReleaseModal(slackReq, releaseName);
        return slackResponse;

      // if release exists
      } else {
        const releaseId = release._id;
        const responseUrl = slackReq.response_url;
        const title = `You chose the *${releaseName}* release.`;
        let primarysToAdd = null;
        let backupsToAdd = null;

        // if there were any matches for onCall engineers, use the slackIdRegex to get an array of their slack IDs
        const primarySlackIds = onCall ? onCall.match(slackIdRegEx) : null;
        if (primarySlackIds) {
          // check primarys already assigned to the release to remove slackIds of engineers already assigned
          primarysToAdd = primarySlackIds.filter((slackId) => {
            const existingSlackIds = release.primaryEngineers.map((engineer) => engineer.slackId);
            return !existingSlackIds.includes(slackId);
          });
        }

        // if there were any matches for backup engineers, use the slackIdRegex to get an array of their slack IDs
        const backupSlackIds = backup ? backup.match(slackIdRegEx) : null;
        if (backupSlackIds) {
          // check backups already assigned to the release to remove slackIds of engineers already assigned
          backupsToAdd = backupSlackIds.filter((slackId) => {
            const existingSlackIds = release.backupEngineers.map((engineer) => engineer.slackId);
            return !existingSlackIds.includes(slackId);
          });
        }

        console.log(primarysToAdd);
        console.log(backupsToAdd);
        
        // update release


        // display updated release info
        slackResponse = await releases.showRelease(releaseId, slackReq.response_url, title);
        return slackResponse;
      }

  } else if (addReleaseRegEx.test(text)) { // add new release: `/oncall 18.9.1 9/7/18`
      console.log('ADD regex matched');
      // if release exists, open dialog for editing release

  } else { // unknown command

  }




};

exports.selectRelease = async (slackReq) => {
  const releaseOptions = await releases.getReleasesAsOptions();
  const title = 'Hello! :slightly_smiling_face:';

  const message = messages.selectRelease(releaseOptions, title);

  const slackResponse = await utils.postToSlack(slackReq.response_url, message, true);
  return slackResponse;
};

