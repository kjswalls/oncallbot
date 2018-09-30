const mongoose = require('mongoose');
const releases = require('./releaseController');
const reminders = require('./reminderController');
const rotation = require('../handlers/rotation');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');

const Release = mongoose.model('Release');
const Engineer = mongoose.model('Engineer');

exports.oncall = async (req, res) => {
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
    res.send('');
    slackResponse = await exports.selectRelease(slackReq);
    return slackResponse;

  } else if (releaseNameRegEx.test(text)) { // view release info: `/oncall 18.9.1`
      res.send('');
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
  
        slackResponse = await releases.displayRelease(releaseId, slackReq.response_url, title);
        return slackResponse;
      }


  } else if (assignEngineersRegEx.test(text)) { // assign people to release: `/oncall 18.9.1 -o @willem.jager -b @hai.phan`
      console.log('ASSIGN regex matched');
      res.send('Got it! Loading...');
      const matches = assignEngineersRegEx.exec(text);
      // const slackIdRegEx = /((<@(\w+)(\|(\w+))?>) ?)/g;
      const slackIdRegEx = /(?<=<@)\w*(?=|)/g;
      const releaseName = matches[1];

      // find out whether -o or -b was passed first
      const onCall = matches[2] === '-o' ? matches[3] : matches[16];
      const backup = matches[2] === '-b' ? matches[3] : matches[16];
      const release = await releases.getReleaseByName(releaseName);

      // if release doesn't exist, open dialog for adding release
      if (!release) {
        slackResponse = await releases.renderAddReleaseModal(slackReq, releaseName);
        return slackResponse;

      // if release exists
      } else {
        const responseUrl = slackReq.response_url;
        let primaryEngineers = null;
        let backupEngineers = null;
        const existingSlackIds = [
          ...release.primaryEngineers.map((engineer) => engineer.slackId), 
          ...release.backupEngineers.map((engineer) => engineer.slackId)
        ];

        // if there were any regex matches for on call engineers
        if (onCall) {
          // use the slackIdRegex to get an array of their slack IDs
          const primarySlackIds = onCall.match(slackIdRegEx);

          // check primarys already assigned to the release to remove slackIds of engineers already assigned
          const primarysToAdd = primarySlackIds.filter((slackId) => {
            return !existingSlackIds.includes(slackId);
          });

          const primaryPromises = primarysToAdd.map((slackId) => {
            // find and increment weight
            const engineerPromise = Engineer.findOneAndUpdate({ slackId }, { $inc: { weight: 1 }}, { new: true });
            return engineerPromise;
          });

          [...primaryEngineers] = await Promise.all(primaryPromises);
        }

        if (backup) {
          // if there were any matches for backup engineers, use the slackIdRegex to get an array of their slack IDs
          const backupSlackIds = backup.match(slackIdRegEx);

          // check backups already assigned to the release to remove slackIds of engineers already assigned
          const backupsToAdd = backupSlackIds.filter((slackId) => {
            return !existingSlackIds.includes(slackId);
          });

          const backupPromises = backupsToAdd.map((slackId) => {
            // find and increment weight
            const engineerPromise = Engineer.findOneAndUpdate({ slackId }, { $inc: { weight: 1 }}, { new: true });
            return engineerPromise;
          });

          [...backupEngineers] = await Promise.all(backupPromises);
        }

        const engineersToAdd = {
          primaryEngineers: primaryEngineers ? primaryEngineers.map((engineer) => engineer.id): [],
          backupEngineers: backupEngineers ? backupEngineers.map((engineer) => engineer.id) : [],
        };
        
        // update release
        const updatedRelease = await Release.findOneAndUpdate({ name: releaseName }, { $push: engineersToAdd }, { new: true });
        let namesAdded = 'No new engineers';
        if (primaryEngineers || backupEngineers) {
          namesAdded = [
            ...primaryEngineers ? primaryEngineers.map(engineer => engineer.name) : [],
            ...backupEngineers ? backupEngineers.map(engineer => engineer.name): [],
          ].join(', ');
        }
        const title = `*${namesAdded}* added to *${releaseName}* release. :point_up:\n Use the \`/remind list\` command to see reminders that have been set`;

        // display updated release info
        slackResponse = await releases.displayRelease(updatedRelease.id, responseUrl, title);

        // add reminders for engineers
        const reminderText = `Release ${releaseName} starts in one hour. You're on call :slightly_smiling_face:`;
        // const reminder = await reminders.createReminders(release.date, reminderText, [...primaryEngineers ? primaryEngineers : [], ...backupEngineers ? backupEngineers : []], responseUrl);
        const reminder = await reminders.createReminders(release, primaryEngineers, backupEngineers, responseUrl);

        // update engineer assignments for future releases
        const updatedReleases = await rotation.updateFutureReleases(release);

        return slackResponse;
      }

  } else if (addReleaseRegEx.test(text)) { // add new release: `/oncall 18.9.1 9/7/18`
      console.log('ADD regex matched');
      res.send('');
      const matches = addReleaseRegEx.exec(text);
      const releaseName = matches[1];
      const releaseDate = matches[2];
      const release = await releases.getReleaseByName(releaseName);

      // if release exists, open dialog for editing release
      if (release) {
        slackResponse = await releases.renderEditReleaseModal(slackReq);
        return slackResponse;
      }

      // otherwise add release
      slackResponse = await releases.addRelease(releaseName, releaseDate, slackReq.response_url);
      return slackResponse;

  } else { // unknown command
    res.send('Sorry, I didn\'t understand that command. Please try again! Use `/oncall help` to see what commands are available.');
    return;
  }
};

exports.selectRelease = async (slackReq) => {
  const releaseOptions = await releases.getReleasesAsOptions();
  const title = 'Hello! :slightly_smiling_face:';

  const message = messages.selectRelease(releaseOptions, title);

  const slackResponse = await utils.postToSlack(slackReq.response_url, message, true);
  return slackResponse;
};

