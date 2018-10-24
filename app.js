const express = require('express');
const routes = require('./routes/index');

const app = express();

// then check our routes
app.use('/', routes);

// done! export it to be required in start.js
module.exports = app;
