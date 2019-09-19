const socketioJwt = require("socketio-jwt");
const config = require("../api/config/config.js");
const timers = require("./timers");

module.exports = function(io) {
    // timer namespace
    // vue-socket.io-extended does not support namespaces
    // const timerNamespace = io.of("/timer");

    // user must be authenticated to use this namespace
    io.on('connection', socketioJwt.authorize({
        secret: config.jwt_secret_key
    })).on('authenticated', (socket) => {
        socket.logger = io.logger;
        timers(io, socket);
    });

};
