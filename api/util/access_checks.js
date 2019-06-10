const userutil = require("./user");
const db = require("../models/index");
/**
 * Functions for checking accesses to resources
 */

exports.ACCESS_WRITE = "write";
exports.ACCESS_READ = "read";
exports.ACCESS_LIST = "list";

exports.get_event_access_callback = (access_type, eid_callback) => {
    eid_callback = eid_callback || ((req) => parseInt(req.params.eid));
    return async (req, res, next) => {
        const eid = eid_callback(req);
        const uid = userutil.getCurrUserId(req);
        const event = await db.Event.findByPk(eid);
        const is_attendee = (await db.EventAttendee.count({ where: { id_user: uid, id_event: eid } })) === 1;
        const is_creator = event.id_creator === uid;
        const is_invited = (await db.EventInvite.count({ where: { id_invitee: uid, status: db.EventInvite.STATUS_PENDING } })) === 1;
        const is_in_event = is_attendee || is_creator || is_invited;

        // check write access
        if (this.access_type === exports.ACCESS_WRITE) {
            if (is_creator || (event.attendees_can_edit && is_attendee)) {
                next();
                return;
            }
        } else if (this.access_type === exports.ACCESS_READ) {
            if (event.visibility === db.Event.VISIBILITY_PUBLIC || is_in_event) {
                next();
                return;
            }
        } else if (this.access_type === exports.ACCESS_LIST) {
            if (event.visibility === db.Event.VISIBILITY_PRIVATE && !is_in_event) {
                next();
                return;
            }
        }

        return util.detailErrorResponse(res, 403, "you don't have the '" + access_type + "' access for executing this operation against this event.");
    };
};