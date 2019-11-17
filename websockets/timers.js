const db = require('../api/models/index');
const includes = require('../api/util/db_include');
const logging = require('../api/util/logging');
const util = require('./util/util');
const {TimerRoom} = require("./util/TimerRoom");
const access = require("../api//util/access_checks");

/**
 * @param glob_sckt The global socket
 * @param auth_sckt The authenticated socket
 * @returns {Function|Promise} A handler for disconnect event, this should be executed when
 */
exports.attachHandlers = (glob_sckt, auth_sckt) => {
  /**
   * stores the timer room the user is currently in
   */
  let timer_room = null;

  let checks = {
    access_timers(access_type) {
      return (s) => {
        const can = !!timer_room && (!!access_type || timer_room.can_access_timer(access_type));
        s.logger.debug(`checking condition for access in room ${timer_room ? timer_room.getRoomName() : "*no room*"} - ${can ? "CAN" : "CANNOT"} access`);
        return can;
      }
    },
    access_delete_timer(access_type) {
      return (s, id_timer) => {
        let room = new TimerRoom(auth_sckt, id_timer);
        const can = !!access_type || room.can_access_timer(access_type);
        s.logger.debug(`checking condition for access in room - ${can ? "CAN" : "CANNOT"} access`);
        return can;
      }
    }
  };

  /** Event 'timer_follow' */
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

  /** Event 'timer_unfollow' */
  util.on(auth_sckt, 'timer_unfollow', async function() {
    auth_sckt.logger.debug('timer_unfollow - ' + timer_room.getRoomName());
    if (!timer_room) {
      auth_sckt.logger.debug("trying to unfollow while not following any timer");
      util.sendErrorEvent(auth_sckt, "not following any timer: cannot unfollow");
      return;
    }
    if (timer_room !== null) {
      timer_room.leave();
      timer_room = null;
    }
  });

  /** Event 'timer_start' */
  util.on(auth_sckt, 'timer_start', async function() {
    const action = await db.sequelize.transaction(async (transaction) => {
      return await timer_room.startTimer(null, transaction);
    });
    if (action.success) {
      await timer_room.emitWithState(glob_sckt, "timer_start");
    } else {
      auth_sckt.logger.debug(`cannot start timer ${action}`);
      util.sendErrorEvent(auth_sckt, 'cannot start timer');
    }
  }, checks.access_timers(access.ACCESS_WRITE));

  /** Event 'timer_stop' */
  util.on(auth_sckt, 'timer_stop',  async function() {
    const action = await db.sequelize.transaction(async (transaction) => {
      return await timer_room.stopTimer(transaction);
    });
    if (action.success) {
      await timer_room.emitWithState(glob_sckt, "timer_stop");
    } else {
      auth_sckt.logger.debug(`cannot stop timer ${action}`);
      util.sendErrorEvent(auth_sckt, 'cannot stop timer');
    }
  }, checks.access_timers(access.ACCESS_WRITE));

  /** Event 'timer_next' */
  util.on(auth_sckt, 'timer_next', async function() {
    const values = await timer_room.nextPlayer();
    await timer_room.emitWithState(glob_sckt, "timer_next");
    // if timer was running, need to check result of next player's timer start promise
    if (values.length === 2 && !values[1].success) {
      auth_sckt.logger.error(`cannot start next player's timer`);
      logging.logError(auth_sckt.logger, values[1].error);
    }
  }, checks.access_timers(access.ACCESS_WRITE));

  /** Event 'timer_prev' */
  util.on(auth_sckt, 'timer_prev', async function() {
    const values = await timer_room.prevPlayer();
    await timer_room.emitWithState(glob_sckt, "timer_prev");
    // if timer was running, need to check result of prev player's timer start promise
    if (values.length === 2 && !values[1].success) {
      auth_sckt.logger.error(`cannot start prev player's timer`);
      logging.logError(auth_sckt.logger, values[1].error);
    }
  }, checks.access_timers(access.ACCESS_WRITE));

  /** Event 'timer_delete' */
  util.on(auth_sckt, 'timer_delete', async function(id_timer) {
    await db.sequelize.transaction(async function (transaction) {
      const timer = await db.GameTimer.findByPk(id_timer, {
        include: [includes.defaultEventIncludeSQ],
        transaction
      });
      const id_user = util.getCurrentUser(auth_sckt).id;
      if (timer === null) {
        throw new Error("cannot delete timer: timer with id " + id_timer + " not found.");
      } else if (timer.id_creator !== id_user && (timer.id_event === null || timer.event.id_creator !== id_user)) {
        throw new Error("cannot delete timer: only the creator can delete a timer.");
      }
      return timer.destroy({transaction});
    });
    // emit also to sender if he's not in the deleted timer's room
    if (timer_room === null || timer_room.id_timer !== id_timer) {
      auth_sckt.emit('timer_delete', id_timer);
    }
    glob_sckt.to(TimerRoom.buildRoomName(id_timer)).emit('timer_delete');
  }, checks.access_delete_timer(access.ACCESS_ADMIN));

  /** Event 'timer_change_player_turn_order' */
  util.on(auth_sckt, 'timer_change_player_turn_order', async function(new_player_turn_order) {
    await db.sequelize.transaction(function(transaction) {
      return Promise.all([
        timer_room.updateCurrentPlayer(0, transaction),
        ...new_player_turn_order.map(player => timer_room.changePlayerTurnOrder(player.id, player.turn_order, transaction))
      ])
    });
    await timer_room.emitWithState(glob_sckt, 'timer_change_player_turn_order');
  }, checks.access_timers(access.ACCESS_WRITE));

  /** Disconnect handler */
  return async (auth_sckt, glob_sckt) => {
    if (timer_room !== null) {
      auth_sckt.logger.info(`timer disconnect - leaving room ${timer_room.getRoomName()}`);
      timer_room.leave();
      timer_room = null;
    }
  };
};