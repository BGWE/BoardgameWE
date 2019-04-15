const socketioJwt = require("socketio-jwt");
const config = require("./config/config.js");
const TimerController = require('./TimerController');

const emitErrorEvent = function(socket, message, event) {
    event = event || 'error';
    socket.emit(event, {
        success: false,
        message: message,
        errors: []
    });
};

const getTimerRoomName = function(id_timer) {
    return "timer/" + id_timer;
};

module.exports = function(io) {
    // timer namespace
    // vue-socket.io-extended does not support namespaces
    // const timerNamespace = io.of("/timer");

    // user must be authenticated to use this namespace
    io.on('connection', socketioJwt.authorize({
        secret: config.jwt_secret_key
    })).on('authenticated', (socket) => {

        // setInterval(() => {
        //     socket.emit('ping', (new Date()).toLocaleTimeString());
        // }, 1000);

        /**
         * Timer
         */
        let current_timer_room = null;

        socket.on('timer_follow', function(id_timer) {
           console.debug('timer_follow - ' + id_timer);
           if (current_timer_room !== null) {
               emitErrorEvent(socket, "cannot follow two timers");
           } else {
               current_timer_room = getTimerRoomName(id_timer);
               socket.join(current_timer_room);
           }
        });

        socket.on('timer_unfollow', function() {
           console.debug('timer_unfollow - ', current_timer_room);
           if (current_timer_room !== null) {
               socket.leave(current_timer_room);
               current_timer_room = null;
           }
        });

        // socket.on('timer_edit', async function(timer) {
        //     console.log('timer_edit');
        //     console.log(timer);
        //     const room = getTimerRoomName(timer.id);
        //     io.broadcast.to(room).emit('timer_update', timer);
        // });

        // socket.on('timer_next', async function(id_timer) {
        //     console.log('timer_next - ' + id_timer);
        //     const game_player = await db.GamePlayerTimer.update({
        //         elapsed: [['elapsed', '+', ()]]
        //     })
        //     }).catch(err => {
        //         emitErrorEvent(socket, "cannot find timer");
        //     })
        // });

        // socket.on('timer_start', async function() {
        //     console.log('timer_start');
        // });

        socket.on('disconnect', () => {
            if (current_timer_room !== null) {
                socket.leave(current_timer_room);
            }
            console.log('disconnect: ' + socket.decoded_token)
        });
    });

};
