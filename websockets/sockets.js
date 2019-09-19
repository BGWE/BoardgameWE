const socketioJwt = require("socketio-jwt");
const config = require("../api/config/config.js");
const timers = require("./timers");
const util = require("./util/util");

module.exports = function(io) {
    // timer namespace
    // vue-socket.io-extended does not support namespaces
    // const timerNamespace = io.of("/timer");

    // user must be authenticated to use this namespace
    io.on('connection', socketioJwt.authorize({
        secret: config.jwt_secret_key
    })).on('authenticated', (auth_sckt) => {
        auth_sckt.logger = io.logger;

        let disconnect_hndlers = [];
        disconnect_hndlers.push(timers.attachHandlers(io, auth_sckt));

        util.on(auth_sckt, "disconnect", async function() {
          disconnect_hndlers.forEach(async fn => await fn(auth_sckt, io));
        });
    });

};
