const socketioJwt = require("socketio-jwt");
const config = require("./config/config.js");

module.exports = function(io) {
    // timer namespace
    const timerNamespace = io.of("/timer");

    // user must be authenticated to use this namespace
    timerNamespace.on('connection', socketioJwt.authorize({
        secret: config.jwt_secret_key
    })).on('authenticated', (socket) => {

        timerNamespace.on('disconnect', () => {
            console.log('disconnect: ' + socket.decoded_token)
        });
    });

};