const express = require('express');
const { log } = require('../helpers/utils');
const { catchErrors } = require('../helpers/errorHandlers');
const slashController = require('../controllers/slashController');
const actionController = require('../controllers/actionController');

const router = express.Router();

router.get('/', slashController.oncall);

router.post('/slack/command/oncall', catchErrors(slashController.oncall));
router.post('/slack/actions', catchErrors(actionController.handleAction));

module.exports = router;
