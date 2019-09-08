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