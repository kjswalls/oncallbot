// import environment variables
require('dotenv').config({ path: 'variables.env' });

// import all models


// start the app
const app = require('./app');
app.set('port', process.env.PORT || 7777);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running on PORT ${server.address().port}`);
});