const express = require('express');
const bodyParser = require('body-parser');

const { catchErrors } = require('../handlers/errorHandlers');
const slashController = require('../controllers/slashController');
const actionController = require('../controllers/actionController');
const verificationMiddleware = require('../middleware/verification');

const router = express.Router();

// add req.rawBody for use by the verification middleware later
// see: https://stackoverflow.com/a/35651853/10142501
const rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

router.get('/', (req, res) => res.send('yo it\'s running'));
router.get('/favicon.ico', (req, res) => res.send('no favicon'));

// take raw requests and turn them into usable properties on req.body for the other routes. 
router.use(bodyParser.json({ verify: rawBodySaver }));
router.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));

// check all slack endpoint requests (to routes below this line) for slack signing secret, to make sure they come from Slack.
router.use(verificationMiddleware);

router.post('/slack/command/oncall', catchErrors(slashController.oncall));
router.post('/slack/actions', catchErrors(actionController.handleActions));

module.exports = router;
