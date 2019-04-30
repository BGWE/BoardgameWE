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
            const timer = await db.GameTimer.findOne({
                where: {id: this.id_timer},
                include: TimerController.getFullTimerIncludes()
            });
            this.emit(action, timer);
            return timer;
        }

        async timerExists(options) {
            return (await db.GameTimer.count(Object.assign({ where: {id: this.id_timer} }, options))) === 1;
        }

        async getTimer(options) {
            return await db.GameTimer.findOne(Object.assign({
                where: {id: this.id_timer}
            }, options));
        }

        async getPlayerCount(options) {
            return await db.PlayerGameTimer.count({ where: { id_timer: this.id_timer } }, options);
        }

        async getPlayerPerTurn(player_turn, options) {
            return await db.PlayerGameTimer.findOne({ where: { id_timer: this.id_timer, turn_order: player_turn }}, options);
        }

        /**
         * Start the given player timer (based on player turn). If the timer is already started nothing is changed.
         * @param player_turn int
         * @param options
         * @returns {Promise<boolean>} Return true if the timer was already running, false if it was stopped.
         */
        async startTimer(player_turn, options) {
            const player = await this.getPlayerPerTurn(player_turn, options);
            const is_started = player.start !== null;
            if (!is_started) {
                await player.update({ start: db.sequelize.fn('now') }, options);
            }
            return is_started;
        }

        /**
         * Stop the given player timer (based on player turn). If the timer is already stopped nothing is changed.
         * @param player_turn int
         * @param options
         * @returns {Promise<boolean>} Return true if the timer was running and was stopped, false if it was already stopped.
         */
        async stopTimer(player_turn, options) {
            const player = await this.getPlayerPerTurn(player_turn, options);
            const is_started = player.start !== null;
            if (is_started) {
                await player.update({ elapsed: player.elapsed + moment().diff(player.start), start: null }, options);
            }
            return is_started;
        }

        /**
         * Change the current player
         * @param new_player int
         * @param options
         * @returns {Promise<void>}
         */
        async updateCurrentPlayer(new_player, options) {
            const timer = await this.getTimer(options);
            await timer.update({ current_player: new_player }, options);
        }

        /**
         * Change current player
         * @param take_next True for taking next, false for taking previous
         * @returns {Promise<void>}
         */
        async changePlayer(take_next) {
            let self = this;
            return db.sequelize.transaction(async function(transaction) {
                const t = {transaction};
                return Promise.all([
                    self.getPlayerCount(t),
                    self.getTimer(t)
                ]).then(values => {
                    const count = values[0], timer = values[1];
                    const next_player = (timer.current_player + (take_next ? 1 : count - 1)) % count;
                    return self.stopTimer(timer.current_player, t).then(is_started => {
                        let promises = [self.updateCurrentPlayer(next_player, t)];
                        if (is_started) {
                            promises.push(self.startTimer(next_player, t));
                        }
                        return Promise.all(promises);
                    });
                });
            })
        }

        async nextPlayer() {
            return this.changePlayer(true);
        }

        async prevPlayer() {
            return this.changePlayer(false);
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
                if (await timer_room.startTimer(timer.current_player)) {
                    sendErrorEvent(socket, 'timer already started');
                } else {
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
                if (!(await timer_room.stopTimer(timer.current_player))) {
                    sendErrorEvent(socket, 'timer already stopped');
                } else {
                    await timer_room.emitWithState("timer_stop");
                }
            } catch (e) {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            }
        });

        socket.on('timer_next', async function() {
            if (timer_room === null) {
                sendErrorEvent(socket, "not following any timer: cannot stop");
                return;
            }
            console.debug('timer_next - ' + timer_room.getRoomName());

            timer_room.nextPlayer().then(async () => {
                await timer_room.emitWithState("timer_next");
            }).catch(async (e) => {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            });
        });

        socket.on('timer_prev', async function() {
            if (timer_room === null) {
                sendErrorEvent(socket, "not following any timer: cannot stop");
                return;
            }
            console.debug('timer_prev - ' + timer_room.getRoomName());

            timer_room.prevPlayer().then(async () => {
                await timer_room.emitWithState("timer_prev");
            }).catch(async (e) => {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            });
        });

        socket.on('timer_change_color', async function(id_player_timer, new_color) {
            if (timer_room === null) {
                sendErrorEvent(socket, "not following any timer: cannot change player color");
                return;
            }
            console.debug('timer_change_color - ' + timer_room.getRoomName());

            if (!new_color.match(/^#[a-fAF0-9]{6}$/)) {
                sendErrorEvent(socket, "cannot update player timer color: invalid color code '" + new_color + "'");
                return;
            }

            db.GamePlayerTimer.update({
                color: new_color
            }, {
                where: { id_timer: timer_room.id_timer, id: id_player_timer }
            }).then(async () => {
                await timer_room.emitWithState("timer_change_color");
            }).catch(async (e) => {
                sendErrorEvent(socket, "cannot update player timer color: " + e.message)
            });
        });

        socket.on('error', function(err) {
            console.log(err);
        });

        socket.on('disconnect', () => {
            if (timer_room !== null) {
                socket.leave(timer_room);
            }
            console.log('disconnect');
        });
    });

};