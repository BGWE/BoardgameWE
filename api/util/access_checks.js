const userutil = require("./user");
const db = require("../models/index");
const util = require("./util");

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
        this.message;
    }
}

exports.can_access_event = async function(access_type, eid_callback, uid_callback) {
    const eid = eid_callback();
    const uid = uid_callback();
    const event = await db.Event.findByPk(eid);
    if (!event) {
        throw new NotFoundError("event not found");
    }
    const is_attendee = (await db.EventAttendee.count({ where: { id_user: uid, id_event: eid } })) === 1;
    const is_creator = event.id_creator === uid;
    const is_invited = (await db.EventInvite.count({ where: { id_event: eid, id_invitee: uid, status: db.EventInvite.STATUS_PENDING } })) === 1;
    const is_in_event = is_attendee || is_creator || is_invited;

    // check write access
    if (access_type === exports.ACCESS_ADMIN) {
        if (is_creator) {
            return true;
        }
    } else if (access_type === exports.ACCESS_WRITE) {
        if (is_creator || (event.attendees_can_edit && is_attendee)) {
            return true;
        }
    } else if (access_type === exports.ACCESS_READ) {
        if (event.visibility === db.Event.VISIBILITY_PUBLIC || is_in_event) {
            return true;
        }
    } else if (access_type === exports.ACCESS_LIST) {
        if (event.visibility === db.Event.VISIBILITY_PRIVATE && !is_in_event) {
            return true;
        }
    }

    return false;
};

exports.get_event_access_callback = (access_type, eid_callback, uid_callback) => {
    return util.asyncMiddleware(async (req, res, next) => {
        eid_callback = eid_callback || (() => parseInt(req.params.eid));
        uid_callback = uid_callback || (() => userutil.getCurrUserId(req));
        try {
            if (await can_access_event(access_type, eid_callback)) {
                next();
            } else {
                return util.detailErrorResponse(res, 403, "you don't have the rights for executing this operation against this event ('" + access_type + "').");
            }
        } catch (e if e instanceof NotFoundError) {
            return util.detailErrorResponse(res, 404, "event not found");
        }
    });
};

exports.get_user_access_callback = (access_type, uid_callback) => {
    uid_callback = uid_callback || ((req) => parseInt(req.params.uid));
    return util.asyncMiddleware(async (req, res, next) => {
        const uid = uid_callback(req);
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