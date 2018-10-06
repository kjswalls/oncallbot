const express = require('express');

const routes = require('./routes/index');
const errorHandlers = require('./handlers/errorHandlers');

const app = express();

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
