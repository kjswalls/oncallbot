const morgan = require('morgan');
const tracer = require('tracer');
const fetch = require('node-fetch');

exports.log = (() => {
  const logger = tracer.colorConsole();
  logger.requestLogger = morgan('dev');
  return logger;
})();

exports.getFromSlack = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
  });
  
  const data = await response.json();
  return data;
}

exports.postToSlack = async (url, body, textResponse = false) => {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`
    },
  });

  const data = textResponse ? response : await response.json();
  return data;
};
