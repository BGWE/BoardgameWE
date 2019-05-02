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

/**
 * Success callback to either TimerRoom.nextPlayer or TimerRoom.prevPlayer
 * @param timer_room
 * @param next
 * @returns {Function}
 */
const genericHandleChangePlayer = function(timer_room, next) {
    const which = next ? "next" : "prev";
    return async (values) => {
        // if timer was running, need to check result of next/prev player's timer start promise
        const start_ok = values.length < 2 || values[1].success;
        await timer_room.emitWithState("timer_" + which);
        if (!start_ok && values.length === 2) {
            sendErrorEvent(socket, 'cannot start ' + which + ' player\'s timer: ' + values[1].error);
        }
    }
};

module.exports = function(io) {
    // timer namespace
    // vue-socket.io-extended does not support namespaces
    // const timerNamespace = io.of("/timer");

    /**
     *  A class representing a timer room
     *
     *  NOTE: all datetimes should be generated by the socket server to remain consistent
     */
    class TimerRoom {
        constructor(socket, id_timer) {
            this.socket = socket;
            this.id_timer = id_timer;
            this.timeout = null;
            this.timer = null;
            this.reload = null;  // not null if timer is of type REALOD
            this.errors = {
                TIMER_ALREADY_STARTED: "timer already started",
                TIMER_HAS_RAN_OUT: "timer has ran out of time",
                TIMER_ALREADY_STOPPED: "timer already stopped"
            }
        }

        /** Fetches current timer data and set class attributes accordingly */
        async setTimer(options) {
            this.timer = await db.GameTimer.findByPk(this.id_timer, options);
            if (this.timer.timer_type === db.GameTimer.RELOAD) {
                this.reload = await db.ReloadGameTimer.findByPk(this.id_timer, options);
            }
        }

        /** Check that timer object has been set */
        async checkTimerIsSet(options) {
            if (!this.timer) {
                await this.setTimer(options);
            }
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
         * Broadcast the action to the timer room, and sends the current state of the timer as message (fetches is from the database
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
         * @returns {Promise<*>} {success: true|false, [error: str]}  (true if timer started, error message only if
         * success is false)
         */
        async startTimer(player_turn, options) {
            await this.checkTimerIsSet(options);
            const player = await this.getPlayerPerTurn(player_turn, options);
            const is_started = player.start !== null;
            if (is_started) {
                return {success: false, error: this.errors.TIMER_ALREADY_STARTED};
            } else if (this.timer.timer_type !== db.GameTimer.COUNT_UP && this.timer.initial_duration - player.elapsed <= 0) {
                return {success: false, error: this.errors.TIMER_HAS_RAN_OUT};
            }
            await player.update({start: moment().utc() }, options);
            return {success: true, error:""};
        }

        /**
         * Stop the given player timer (based on player turn). If the timer is already stopped nothing is changed.
         * @param player_turn int
         * @param options
         * @returns {Promise<*>} {success: true|false, [error: str]}  (true if timer stopped, error message only if
         * success is false)
         */
        async stopTimer(player_turn, options) {
            await this.checkTimerIsSet(options);
            const player = await this.getPlayerPerTurn(player_turn, options);
            const is_started = player.start !== null;
            if (!is_started) {
                return {success: false, error: this.errors.TIMER_ALREADY_STOPPED};
            }
            let data = { elapsed: player.elapsed + moment().diff(player.start), start: null };
            if (this.timer.timer_type === db.GameTimer.RELOAD) { // subtract duration increment
                data.elapsed = Math.max(0, data.elapsed - this.reload.duration_increment);
            }
            await player.update(data, options);
            return {success: true}
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
         * @returns {Promise<*>}
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
                    return self.stopTimer(timer.current_player, t).then(action => {
                        let promises = [self.updateCurrentPlayer(next_player, t)];
                        if (action.success) {
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
            if (!timer_room) {
                sendErrorEvent(socket, "not following any timer: cannot start");
                return;
            }
            console.debug('timer_start - ' + timer_room.getRoomName());
            try {
                await timer_room.setTimer(); // refresh internal timer object
                const action = await timer_room.startTimer(timer_room.timer.current_player);
                if (action.success) {
                    await timer_room.emitWithState("timer_start");
                } else {
                    sendErrorEvent(socket, 'cannot start timer: ' + action.error);
                }
            } catch (e) {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            }
        });

        socket.on('timer_stop', async function() {
            if (!timer_room) {
                sendErrorEvent(socket, "not following any timer: cannot stop");
                return;
            }
            console.debug('timer_stop - ' + timer_room.getRoomName());
            try {
                await timer_room.setTimer(); // refresh internal timer object
                const action = await timer_room.stopTimer(timer_room.timer.current_player);
                if (action.success) {
                    await timer_room.emitWithState("timer_stop");
                } else {
                    sendErrorEvent(socket, 'cannot stop timer: ' + action.error);
                }
            } catch (e) {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            }
        });

        socket.on('timer_next', async function() {
            if (!timer_room) {
                sendErrorEvent(socket, "not following any timer: cannot stop");
                return;
            }
            console.debug('timer_next - ' + timer_room.getRoomName());

            timer_room.nextPlayer().then(genericHandleChangePlayer(timer_room, true)).catch(async (e) => {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            });
        });

        socket.on('timer_prev', async function() {
            if (!timer_room) {
                sendErrorEvent(socket, "not following any timer: cannot prev");
                return;
            }
            console.debug('timer_prev - ' + timer_room.getRoomName());

            timer_room.prevPlayer().then(genericHandleChangePlayer(timer_room, false)).catch(async (e) => {
                sendErrorEvent(socket, "cannot update timer: " + e.message)
            });
        });

        socket.on('timer_change_color', async function(id_player_timer, new_color) {
            if (!timer_room) {
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
