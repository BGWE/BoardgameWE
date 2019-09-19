const db = require('../api/models/index');
const includes = require('../api/util/db_include');
const logging = require('../api/util/logging');
const util = require('./util/util');
const {TimerRoom} = require("./util/TimerRoom");
const access = require("../api//util/access_checks");

/**
 * Success callback to either TimerRoom.nextPlayer or TimerRoom.prevPlayer
 * @param sckt
 * @param timer_room
 * @param next
 * @returns {Function}
 */
const genericHandleChangePlayer = function(sckt, timer_room, next) {
    const which = next ? "next" : "prev";
    return async (values) => {
        await timer_room.emitWithState(sckt, "timer_" + which);
        // if timer was running, need to check result of next/prev player's timer start promise
        if (values.length === 2 && !values[1].success) {
            util.sendErrorEvent(sckt, 'cannot start ' + which + ' player\'s timer: ' + values[1].error);
        }
    }
};


/**
 * @param glob_sckt The global socket
 * @param auth_sckt The authenticated socket
 */
module.exports = (glob_sckt, auth_sckt) => {
  /**
   * stores the timer room the user is currently in
   */
  let timer_room = null;

  let checks = {
    access_timers(name, access_type) {
      return (s) => {
        if (!timer_room) {
          util.sendErrorEvent(s, "cannot execute '" + name + "': not following any timer");
          return false;
        }
        if (access_type && !timer_room.can_access_timer(access_type)) {
          util.sendErrorEvent(s, "cannot execute '" + name + "': this timer does not exist or you don't have the authorization to execute a '" + access_type + "' operation.");
          return false;
        }
        io.logger.debug(name + ' - ' + timer_room.getRoomName());
        return true;
      }
    }
  };

  util.on(auth_sckt, 'timer_follow', async function (id_timer) {
    auth_sckt.logger.debug('timer_follow - ' + id_timer);
    if (timer_room !== null) {
      util.sendErrorEvent(auth_sckt, "cannot follow more than one timer at a time");
      return;
    }
    timer_room = new TimerRoom(auth_sckt, id_timer);
    await timer_room.setTimer();
    if (await timer_room.can_access_timer(access.ACCESS_READ)) {
      timer_room.join();
    } else {
      timer_room = null;
      auth_sckt.logger.crit(`blocked attempt to follow timer ${id_timer} (user ${util.getCurrentUser(sckt)})`);
      util.sendErrorEvent(auth_sckt, "cannot follow this timer");
    }
  });

    auth_sckt.on('timer_unfollow', function() {
        if (!timer_room) {
            util.sendErrorEvent(auth_sckt, "not following any timer: cannot unfollow");
            return;
        }
        io.logger.debug('timer_unfollow - ' + timer_room.getRoomName());
        if (timer_room !== null) {
            timer_room.leave();
            timer_room = null;
        }
    });

    auth_sckt.on('timer_start', util.callbackWithCheck(auth_sckt, checks.access_timers("timer_start", access.ACCESS_WRITE), async function() {
        try {
            const action = await db.sequelize.transaction(async (transaction) => {
                return await timer_room.startTimer(null, transaction);
            });
            if (action.success) {
                await timer_room.emitWithState(glob_sckt, "timer_start");
            } else {
                util.sendErrorEvent(auth_sckt, 'cannot start timer: ' + action.error);
            }
        } catch (e) {
            logging.logError(io.logger, e);
            util.sendErrorEvent(auth_sckt);
        }
    }));

    auth_sckt.on('timer_stop', util.callbackWithCheck(auth_sckt, checks.access_timers("timer_stop", access.ACCESS_WRITE), async function() {
        try {
            const action = await db.sequelize.transaction(async (transaction) => {
                return await timer_room.stopTimer(transaction);
            });
            if (action.success) {
                await timer_room.emitWithState(glob_sckt, "timer_stop");
            } else {
                util.sendErrorEvent(auth_sckt, 'cannot stop timer: ' + action.error);
            }
        } catch (e) {
            logging.logError(io.logger, e);
            util.sendErrorEvent(auth_sckt);
        }
    }));

    auth_sckt.on('timer_next', util.callbackWithCheck(auth_sckt, checks.access_timers("timer_next", access.ACCESS_WRITE), async function() {
        timer_room.nextPlayer().then(genericHandleChangePlayer(io, timer_room, true)).catch(async (e) => {
            logging.logError(io.logger, e);
            util.sendErrorEvent(auth_sckt);
        });
    }));

    auth_sckt.on('timer_prev', util.callbackWithCheck(auth_sckt, checks.access_timers("timer_prev", access.ACCESS_WRITE), async function() {
        timer_room.prevPlayer().then(genericHandleChangePlayer(io, timer_room, false)).catch(async (e) => {
            logging.logError(io.logger, e);
            util.sendErrorEvent(auth_sckt);
        });
    }));

    auth_sckt.on('timer_delete', function(id_timer) {
        db.sequelize.transaction(async function (transaction) {
            const timer = await db.GameTimer.findByPk(id_timer, {
                include: [includes.defaultEventIncludeSQ],
                lock: transaction.LOCK.UPDATE,
                transaction
            });
            const id_user = util.getCurrentUser(auth_sckt).id;
            if (timer === null) {
                throw new Error("cannot delete timer: timer with id " + id_timer + " not found.");
            } else if (timer.id_creator !== id_user && (timer.id_event === null || timer.event.id_creator !== id_user)) {
                throw new Error("cannot delete timer: only the creator can delete a timer.");
            }
            return timer.destroy({transaction});
        }).then(() => {
            // emit also to sender if he's not in the deleted timer's room
            if (timer_room === null || timer_room.id_timer !== id_timer) {
                auth_sckt.emit('timer_delete', id_timer);
            }
            io.to(TimerRoom.buildRoomName(id_timer)).emit('timer_delete');
        }).catch(err => {
            logging.logError(io.logger, err);
            util.sendErrorEvent(auth_sckt)
        });
    });

    auth_sckt.on('timer_change_player_turn_order', util.callbackWithCheck(auth_sckt, checks.access_timers("timer_change_player_turn_order", access.ACCESS_WRITE), async function(new_player_turn_order) {
        await db.sequelize.transaction(function(transaction) {
            return Promise.all([
                timer_room.updateCurrentPlayer(0, transaction),
                ...new_player_turn_order.map(player => timer_room.changePlayerTurnOrder(player.id, player.turn_order, transaction))
            ])
        }).then(async values => {
            io.logger.debug('timer_change_player_turn_order - Transaction completed with values: ', values);
            await timer_room.emitWithState(glob_sckt, 'timer_change_player_turn_order');
        }).catch(error => {
            logging.logError(io.logger, error);
            util.sendErrorEvent(auth_sckt);
        });
    }));

    auth_sckt.on('error', function(err) {
        console.log(err);
    });

    auth_sckt.on('disconnect', () => {
        let message = "disconnect " + util.getCurrentUser(auth_sckt).id;
        if (timer_room !== null) {
            message += " (leaving room " + timer_room.getRoomName() + ")";
            auth_sckt.leave(timer_room);
        }
        auth_sckt.logger.info(message);
    });
};