const mongoose = require('mongoose');
const releases = require('../handlers/releaseMethods');
const utils = require('../handlers/utils');
const messages = require('../handlers/messages');

const Release = mongoose.model('Release');

exports.oncall = async (req, res) => {
  res.send('');
  const slackReq = req.body;
  const releaseOptions = await releases.getReleasesAsOptions();
  const title = 'Hello! :slightly_smiling_face:';

  const message = messages.selectRelease(releaseOptions, title);

  const slackResponse = await utils.postToSlack(slackReq.response_url, message, true);
  return slackResponse;
};
