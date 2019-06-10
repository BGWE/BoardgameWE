const userutil = require("./user");
const db = require("../models/index");
const util = require("./util");

/**
 * Functions for checking accesses to resources
 */

exports.ACCESS_WRITE = "write";
exports.ACCESS_READ = "read";
exports.ACCESS_LIST = "list";

exports.get_event_access_callback = (access_type, eid_callback) => {
    eid_callback = eid_callback || ((req) => parseInt(req.params.eid));
    return util.asyncMiddleware(async (req, res, next) => {
        const eid = eid_callback(req);
        const uid = userutil.getCurrUserId(req);
        const event = await db.Event.findByPk(eid);
        if (!event) {
            return util.detailErrorResponse(res, 404, "event not found");
        }
        const is_attendee = (await db.EventAttendee.count({ where: { id_user: uid, id_event: eid } })) === 1;
        const is_creator = event.id_creator === uid;
        const is_invited = (await db.EventInvite.count({ where: { id_event: eid, id_invitee: uid, status: db.EventInvite.STATUS_PENDING } })) === 1;
        const is_in_event = is_attendee || is_creator || is_invited;

        // check write access
        if (access_type === exports.ACCESS_WRITE) {
            if (is_creator || (event.attendees_can_edit && is_attendee)) {
                next();
                return;
            }
        } else if (access_type === exports.ACCESS_READ) {
            if (event.visibility === db.Event.VISIBILITY_PUBLIC || is_in_event) {
                next();
                return;
            }
        } else if (access_type === exports.ACCESS_LIST) {
            if (event.visibility === db.Event.VISIBILITY_PRIVATE && !is_in_event) {
                next();
                return;
            }
        }

        return util.detailErrorResponse(res, 403, "you don't have the rights for executing this operation against this event ('" + access_type + "').");
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