const morgan = require('morgan');
const tracer = require('tracer');

exports.log = (() => {
  const logger = tracer.colorConsole();
  logger.requestLogger = morgan('dev');
  return logger;
})();
