const morgan = require('morgan');
const tracer = require('tracer');
const fetch = require('node-fetch');

exports.log = (() => {
  const logger = tracer.colorConsole();
  logger.requestLogger = morgan('dev');
  return logger;
})();

exports.sendToSlack = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`
    },
  });

  const data = await response.json();
  return data;
};
