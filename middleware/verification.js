const crypto = require('crypto');
// const queryString = require('query-string');

module.exports = (req, res, next) => {
  const reject = () => {
    return res.sendStatus(403); // forbidden
  };

  // Retrieve the X-Slack-Request-Timestamp header on the HTTP request
  const timestamp = req.get('X-Slack-Request-Timestamp') || 0;

  // check if timestamp is older than 5 min from right now
  const FIVE_MIN = 60 * 5; // seconds
  const now = Math.floor(Date.now() / 1000); // convert from milliseconds to seconds
  if (Math.abs(now - timestamp) > FIVE_MIN) {
    return reject();
  }

  // Concatenate the version number, the timestamp, and the body of the request to form a basestring. Use a colon as the delimiter between the three elements. For example, v0:123456789:command=/weather&text=94070. The version number right now is always v0.
  const version = 'v0';

  // this raw text version of the body is made available on the reqest via a middleware in routes/index.js
  const body = req.rawBody;
  const basestring = `${version}:${timestamp}:${body}`;

  // Then hash the resulting string, using the signing secret as a key, and taking the hex digest of the hash.
  // The full signature is formed by prefixing the hex digest with v0=
  const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
  hmac.update(basestring);
  const signature = `v0=${hmac.digest('hex')}`;

  // Compare this computed signature to the X-Slack-Signature header on the request.
  const slackSignature = req.get('X-Slack-Signature') || '';
  const isValid = crypto.timingSafeEqual(new Buffer(signature, 'utf-8'), new Buffer(slackSignature, 'utf-8'));

  if (isValid) {
    return next();
  } else {
    return reject();
  }
};
