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
  const assignEngineersRegEx = /(^\d\d\.\d{1,2}\.\d{1}) (-[ob]) <@(\w+)(\|(\w+))?>( (<@)(\w+)(\|(\w+))?> )*((-[ob]) (<@(\w+)(\|(\w+))?>))?( (<@)(\w+)(\|(\w+))?> )*/;
  
  // `/oncall 18.9.1 9/7/18`
  const addReleaseRegEx = /(\d\d\.\d{1,2}\.\d{1})( ([1-9]|0[1-9]|1[012])[- /.]([1-9]|0[1-9]|[12][0-9]|3[01])[- /.]((19|20)\d\d|\d\d))/;

  if (text === '') { // select a release: `/oncall`
    slackResponse = await exports.selectRelease(slackReq);
    return slackResponse;

  } else if (releaseNameRegEx.test(text)) { // view release info: `/oncall 18.9.1`
      console.log('NAME regex matched');
      // if release doesn't exist, open dialog for adding release

  } else if (assignEngineersRegEx.test(text)) { // assign people to release: `/oncall 18.9.1 -o @willem.jager -b @hai.phan`
      console.log('ASSIGN regex matched');
      // if release doesn't exist, open dialog for adding release
      // if release has assigned engineers, add/overwrite
      // use flags for oncall and backup

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

