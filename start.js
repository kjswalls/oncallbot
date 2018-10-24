const mongoose = require('mongoose');
const moment = require('moment-timezone');
moment.tz.setDefault("America/Los_Angeles");

// import environment variables
require('dotenv').config({ path: 'variables.env' });

// connect to our database, handle bad connections
mongoose.set('useFindAndModify', false); // deprecated in mongoDB
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useCreateIndex: true, });
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (err) => {
  console.error(`DB error: ${err.message}`);
});

// import all models
require('./models/Release');
require('./models/Engineer');
require('./models/Reminder');

// start the app
const app = require('./app');
app.set('port', process.env.PORT || 7777);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running on PORT ${server.address().port}`);
});