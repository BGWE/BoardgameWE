const socketioJwt = require("socketio-jwt");
const config = require("./config/config.js");
const TimerController = require('./TimerController');
const db = require('./models/index');
const moment = require('moment');


const sendErrorEvent = function(socket, message, event) {
    event = event || 'error';
    socket.send(event, {
        success: false,
        message: message,
        errors: []
    });
};

module.exports = function(io) {
    // timer namespace
    // vue-socket.io-extended does not support namespaces
    // const timerNamespace = io.of("/timer");

    /**
     *  A class representing a timer room
     */
    class TimerRoom {
        constructor(socket, id_timer) {
            this.socket = socket;
            this.id_timer = id_timer;
            this.timeout = null;
        }

        getRoomName() {
            return "timer/" + this.id_timer;
        }

        join() {
            this.socket.join(this.getRoomName());
        }

        leave() {
            this.socket.leave(this.getRoomName());
        }

        emit(action, data) {
            io.to(this.getRoomName()).emit(action, data);
        }

        /**
         * Broadcast the action to the timer room, and sends the current state of the timer as message
         * @param action str
         * @returns {Promise<void>}
         */
        async emitWithState(action) {
            const timer = await db.GameTimer.find({
                where: {id: this.id_timer},
                include: TimerController.getFullTimerIncludes()
            });
            this.emit(action, timer);
            return timer;
        }

        async timerExists() {
            return (await db.GameTimer.count({ where: {id: this.id_timer}})) === 1;
        }

        async getTimer() {
            return await db.GameTimer.find({
                where: {id: this.id_timer}
            });
        }
    }

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
        let timer_room = null;

        socket.on('timer_follow', function(id_timer) {
            console.debug('timer_follow - ' + id_timer);
            if (timer_room !== null) {
                sendErrorEvent(socket, "cannot follow two timers");
            } else {
                timer_room = new TimerRoom(socket, id_timer);
                if (timer_room.timerExists()) {
                    timer_room.join();
                } else {
                    timer_room = null;
                    sendErrorEvent(socket, "no such timer");
                }
            }
        });

        socket.on('timer_unfollow', function() {
            if (!timer_room) {
                sendErrorEvent(socket, "not following any timer: cannot unfollow");
                return;
            }
            console.debug('timer_unfollow - ' + timer_room.getRoomName());
            if (timer_room !== null) {
                timer_room.leave();
                timer_room = null;
            }
        });

        socket.on('timer_start', async function() {
            if (timer_room === null) {
                sendErrorEvent(socket, "not following any timer: cannot start");
                return;
            }
            console.debug('timer_start - ' + timer_room.getRoomName());
            try {
                const timer = await timer_room.getTimer();
                const player_timer = await db.PlayerGameTimer.find({
                    where: {
                        id_timer: timer.id,
                        turn_order: timer.current_player
                    }
                });

                if (player_timer.start !== null) {
                    sendErrorEvent(socket, 'timer already started');
                } else {
                    await player_timer.update({
                        start: db.sequelize.fn('now')
                    });
                    await timer_room.emitWithState("timer_start");
                }
            } catch (e) {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            }
        });

        socket.on('timer_stop', async function() {
            if (timer_room === null) {
                sendErrorEvent(socket, "not following any timer: cannot stop");
                return;
            }
            console.debug('timer_stop - ' + timer_room.getRoomName());
            try {
                const timer = await timer_room.getTimer();
                const player_timer = await db.PlayerGameTimer.find({
                    where: {
                        id_timer: timer.id,
                        turn_order: timer.current_player
                    }
                });

                if (player_timer.start === null) {
                    sendErrorEvent(socket, 'timer already stopped');
                } else {
                    await player_timer.update({
                        elapsed: player_timer.elapsed + moment().diff(player_timer.start),
                        start: null
                    });
                    await timer_room.emitWithState("timer_stop");
                }
            } catch (e) {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            }
        });

        socket.on('error', function(err) {
            console.log(err);
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
        //         sendErrorEvent(socket, "cannot find timer");
        //     })
        // });

        // socket.on('timer_start', async function() {
        //     console.log('timer_start');
        // });

        socket.on('disconnect', () => {
            if (timer_room !== null) {
                socket.leave(timer_room);
            }
            console.log('disconnect');
        });
    });

};
