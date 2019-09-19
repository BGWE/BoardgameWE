exports.sendErrorEvent = function(socket, message, event) {
    event = event || 'error';
    socket.send(event, {
        success: false,
        message: message,
        errors: []
    });
};

exports.getCurrentUser = function(socket) {
    return socket.decoded_token;
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
