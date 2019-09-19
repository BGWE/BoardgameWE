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
 * Generates a callback that first checks an access condition before possibly executing the actual callback
 * @param socket Socket
 * @param check_fn A callable that takes a socket and returns a boolean
 * @param callback The actual callback
 * @returns {Function}
 */
exports.callbackWithCheck = function(socket, check_fn, callback) {
    return async (...args) => {
        const checked = await check_fn(socket);
        if (checked) {
            await callback(...args);
        }
    };
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
    const user = exports.getCurrentUser(sckt);
    sckt.logger.info('WS' + (user ? ` (user:${user.id}) ` : ' ') + `'${event}' ` + JSON.stringify(args));
    try {
      const checked = cond_fn ? (await cond_fn(sckt)) : true;
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