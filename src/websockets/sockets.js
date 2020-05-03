const socketioJwt = require("socketio-jwt");
const config = require("../api/config/config.js");
const timers = require("./timers");
const util = require("./util/util");

module.exports = function (io) {
  // timer namespace
  // vue-socket.io-extended does not support namespaces
  // const timerNamespace = io.of("/timer");

  io.on("connect", async function(s) {
    io.logger.info('socket.io connect from ' + s.handshake.address);
  });

  io
  .on('connection', socketioJwt.authorize({ secret: config.jwt_secret_key }))
  .on('authenticated', (auth_sckt) => {
    auth_sckt.logger = io.logger;
    auth_sckt.logger.info(`WS user:${util.getCurrentUser(auth_sckt).id} has authenticated`);

    let disconnectHandlers = [];

    /** Timers handlers */
    disconnectHandlers.push(timers.attachHandlers(io, auth_sckt));

    util.on(auth_sckt, "disconnect", async function () {
      disconnectHandlers.forEach(async fn => await fn(auth_sckt, io));
    });
  });
};
