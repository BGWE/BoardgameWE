const logging = require("../../api/util/logging");

exports.sendErrorEvent = function(socket, message, event) {
    event = event || 'error';
    socket.send(event, {
        success: false,
        message: message,
        errors: []
    });
};

exports.getCurrentUser = function(sckt) {
    return sckt.decoded_token;
};

/**
 * Wraps a call to socket.on to handle logging and conditional access
 * @param sckt The socket. Should have a `logger` associated to it.
 * @param event The event name
 * @param callback  An asynchronous callback
 * @param cond_fn An asynchronous function for checking access to the callback. If cond_fn eventually
 * returns false, the callback is not executed.
 */
exports.on = (sckt, event, callback, cond_fn) => {
  sckt.on(event, async (...args) => {
    try {
      const user = exports.getCurrentUser(sckt);
      sckt.logger.info('WS' + (user ? ` (user:${user.id}) ` : ' ') + `'${event}' ` + JSON.stringify(args));
      const checked = cond_fn ? (await cond_fn(sckt, ...args)) : true;
      if (checked) {
        await callback(...args);
      } else {
        sckt.logger.warn(`condition for event '${event}' returns false`);
      }
    } catch (err) {
      logging.logError(sckt.logger, err);
    }
  });
};