const userutil = require("./user");
const db = require("../models/index");
const util = require("./util");
const includes = require("./db_include");

/**
 * Functions for checking accesses to resources
 */

exports.ACCESS_WRITE = "write";
exports.ACCESS_READ = "read";
exports.ACCESS_LIST = "list";
exports.ACCESS_ADMIN = "admin";


class NotFoundError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

class CannotUpdateGameError extends Error {
    constructor(message) {
      super();
      this.message = message;
    }
}

exports.NotFoundError = NotFoundError;

exports.can_access_event = async function(access_type, eid_callback, uid_callback) {
    const eid = eid_callback();
    const uid = uid_callback();
    let event = await db.Event.findByPk(eid, { include: includes.getEventUserAccessIncludes(uid) });
    if (!event) {
        throw new NotFoundError("event not found");
    }
    const current = includes.formatRawEventWithUserAccess(uid, event).dataValues.current;
    const is_in_event = current.is_attendee || current.is_creator || current.is_invitee;

    // check write access
    if (access_type === exports.ACCESS_ADMIN && current.is_creator) {
        return true;
    } else if (access_type === exports.ACCESS_WRITE && current.can_write) {
        return true;
    } else if (access_type === exports.ACCESS_READ && current.can_read) {
        return true;
    } else if (access_type === exports.ACCESS_LIST) {
        if (event.visibility === db.Event.VISIBILITY_PRIVATE && !is_in_event) {
            return true;
        }
    }

    return false;
};

exports.get_event_access_callback = (access_type) => {
    return util.asyncMiddleware(async (req, res, next) => {
        const eid_callback = () => parseInt(req.params.eid);
        const uid_callback = () => userutil.getCurrUserId(req);
        try {
            if (await exports.can_access_event(access_type, eid_callback, uid_callback)) {
                next();
            } else {
                return util.detailErrorResponse(res, 403, "you don't have the rights for executing this operation against this event ('" + access_type + "').");
            }
        } catch (e) {
            if (e instanceof NotFoundError) {
                return util.detailErrorResponse(res, 404, "event not found");
            } else {
                throw e;
            }
        }
    });
};

exports.get_user_access_callback = (access_type) => {
    return util.asyncMiddleware(async (req, res, next) => {
        const uid = parseInt(req.params.uid);
        const current_uid = userutil.getCurrUserId(req);

        // check write access
        if (access_type === exports.ACCESS_WRITE) {
            if (uid === current_uid) {
                next();
                return;
            }
        } else if (access_type === exports.ACCESS_READ) {
            const friendCount = await db.Friendship.areFriends(current_uid, uid);
            if (current_uid === uid || friendCount === 1) {
                next();
                return;
            }
        } else if (access_type === exports.ACCESS_LIST) {
            next();
        }

        return util.detailErrorResponse(res, 403, "you don't have the rights for executing this operation against this user ('" + access_type + "')");
    });
};

exports.can_access_timer = async (access_type, tid_callback, uid_callback) => {
    const tid = tid_callback();
    const uid = uid_callback();
    const timer = await db.GameTimer.findByPk(tid);
    if (!timer) {
        throw new NotFoundError("timer not found");
    }
    const is_timer_player = (await db.PlayerGameTimer.count({ where: { id_user: uid, id_timer: tid } })) === 1;
    const is_creator = timer.id_creator === uid;
    return (access_type === exports.ACCESS_ADMIN && is_creator)
            || ((access_type === exports.ACCESS_WRITE
                 || access_type === exports.ACCESS_READ
                 || access_type === exports.ACCESS_LIST)
                && (is_creator || is_timer_player));
};


exports.can_access_game = async (access_type, gid_callback, uid_callback, new_game) => {
  const gid = gid_callback();
  const uid = uid_callback();
  const game = await db.Game.findByPk(gid);
  if (!game) {
    throw new NotFoundError("game not found");
  }
  if (new_game && new_game.id_event && game.id_event && new_game.id_event !== game.id_event) {
    throw new CannotUpdateGameError("cannot switch a game from an event to another");
  }
  if (game.id_event !== null || (new_game && new_game.id_event)) { // must fall back to event access policy if game is linked to an event
    const id_event = new_game ? new_game.id_event : game.id_event;
    return await exports.can_access_event(access_type, () => id_event, () => uid);
  }
  const players = await db.GamePlayer.findAll({ where: {id_game: gid, id_user: {[db.Op.ne]: null}}, attributes: ['id_user']});
  const player_ids = new Set(players.map(p => p.id_user));
  const friends = new Set(await db.Friendship.getFriendIds([...player_ids]));
  return (friends.has(uid) && access_type === exports.ACCESS_READ) || player_ids.has(uid);
};


exports.get_game_access_callback = (access_type) => {
  return util.asyncMiddleware(async (req, res, next) => {
    const gid_callback = () => parseInt(req.params.gid);
    const uid_callback = () => userutil.getCurrUserId(req);
    try {
      if (await exports.can_access_game(access_type, gid_callback, uid_callback, req.body)) {
        next();
      } else {
        return util.detailErrorResponse(res, 403, "you don't have the rights for executing this operation against this game ('" + access_type + "').");
      }
    } catch (e) {
      if (e instanceof NotFoundError || e instanceof CannotUpdateGameError) {
        return util.detailErrorResponse(res, (e instanceof NotFoundError) ? 404 : 403, e.message);
      } else {
        throw e;
      }
    }
  });
};

exports.check_add_game_event_access = util.asyncMiddleware(async (req, res, next) => {
  if (!req.body.id_event) {
    next();
  }
  const eid_callback = () => parseInt(req.body.id_event);
  const uid_callback = () => userutil.getCurrUserId(req);
  const error_message = "cannot add game";
  try {
    if (exports.can_access_event(exports.ACCESS_WRITE, eid_callback, uid_callback)) {
      next();
    } else {
      return util.detailErrorResponse(res, 403, error_message + ": the use has no write access on this event");
    }
  } catch (e) {
    return util.detailErrorResponse(res, e instanceof NotFoundError ? 404 : 403, error_message + ": " + e.message);
  }
});