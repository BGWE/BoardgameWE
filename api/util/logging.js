const winston = require('winston');

/**
 * Builds a middleware that filters the body logs
 * @param w Whitelist (an array of fields)
 * @param b Blacklist (an array of fields)
 * @returns {Function}
 */
exports.bodyLogFilter = ({w, b}) => {
  return (req, res, next) => {
    req._routeWhitelists.body = w || req._routeWhitelists.body;
    req._routeBlacklists.body = b || [];
    next();
  };
};


exports.logError = (logger, err) => {
  const err_info = winston.exceptions.getAllInfo(err);
  logger.error(err_info.error);
  logger.error(err_info.stack);
};

// define general log format
const log_format = winston.format.printf((options) => {
  return `[${options.timestamp}] [${options.level}] [${options.label}] ${options.message}`;
});

/**
 * Create a general format winston object for logs
 * @param label A logger identifier to be printed in the string
 * @returns {Format}
 */
exports.get_default_format = (label) => {
  return winston.format.combine(
      winston.format.label({label}),
      winston.format.colorize(),
      winston.format.timestamp(),
      log_format
  );
};