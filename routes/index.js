const express = require('express');
const { log } = require('../helpers/utils');
const { catchErrors } = require('../helpers/errorHandlers');
const slashController = require('../controllers/slashController');
const actionController = require('../controllers/actionController');
const verificationMiddleware = require('../middleware/verification');

const router = express.Router();

// check all requests for slack verification token
// router.use(verificationMiddleware);

router.get('/', (req, res) => res.send('yo it\'s running'));
router.get('/favicon.ico', (req, res) => res.send('no favicon'));

router.post('/slack/command/oncall', catchErrors(slashController.oncall));
router.get('/slack/command/oncall', catchErrors(slashController.oncall));
router.post('/slack/actions', catchErrors(actionController.handleActions));

module.exports = router;
