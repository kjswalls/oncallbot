const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const errorHandlers = require('./handlers/errorHandlers');

const app = express();

// take raw requests and turn them into usable properties on req.body
app.use(bodyParser.json());
// allow for form data (form-urlencoded header) and nested form fields (extended: true)
app.use(bodyParser.urlencoded({ extended: true }));

// then check our routes
app.use('/', routes);

// if those routes didn't work, forward them to 404 handler
// app.use(errorHandlers.notFound);

// otherwise, it's a bad error we didn't expect
if (app.get('env') === 'development') {
  app.use(errorHandlers.developmentErrors);
}

// production error handler
// app.use(errorHandlers.productionErrors);

// done! export it to be required in start.js
module.exports = app;
