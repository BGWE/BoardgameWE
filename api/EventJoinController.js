const db = require("./models/index");
const util = require("./util/util");
const userutil = require("./util/user");
const includes = require("./util/db_include");
const EventController = require('./EventController');


const fetch_event_access_state = async (uid, eid, transaction) => {
    const results = await Promise.all([
        db.Event.findByPk(eid, { transaction, lock: transaction.LOCK.SHARE }),
        db.EventAttendee.findOne({ where: { id_event: eid, id_user: uid }, transaction, lock: transaction.LOCK.UPDATE }),
        db.EventInvite.findOne({ where: { id_event: eid, id_invitee: uid }, transaction, lock: transaction.LOCK.UPDATE}),
        db.EventJoinRequest.findOne({ where: {id_event: eid, id_requester: uid }, transaction, lock: transaction.LOCK.UPDATE})
    ]);
    return {
        event: results[0],
        is_attendee: !!results[1],
        attendee: results[1],
        is_invitee: !!results[2],
        invite: results[2],
        is_requester: !!results[3],
        request: results[3]
    }
};

const create_join_request = (pk, status, transaction) => {
    return db.EventJoinRequest.create({ ... pk, status }, { transaction });
};

const create_attendee = (uid, eid, transaction) => {
    return db.EventAttendee.create({ id_user: uid, id_event: eid }, { transaction });
};

const create_invitee = (pk, id_inviter, status, transaction) => {
    return db.EventInvite.create({ ... pk, id_inviter, status }, { transaction });
};

exports.eventInviteIncludes = [
    includes.getShallowUserIncludeSQ('inviter'),
    includes.getShallowUserIncludeSQ('invitee'),
    includes.getEventIncludeSQ('event')
];

exports.eventJoinRequestIncludes = [
    includes.getShallowUserIncludeSQ('requester'),
    includes.getEventIncludeSQ('event')
];

exports.listEventInvites = function(req, res) {
    let where = {};
    if (req.query.status !== undefined) {
        where = {
            status: { [db.Op.in]: req.query.status.map(s => s.toUpperCase()) },
            ... where
        }
    }
    return util.sendModelOrError(res, db.EventInvite.findAll({ where, include: exports.eventInviteIncludes }));
};

exports.sendEventInvite = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    const eid = parseInt(req.params.eid);
    return db.sequelize.transaction(transaction => {
        return fetch_event_access_state(req.body.id_invitee, eid, transaction).then(access_state => {
            if (access_state.is_attendee) {
                return util.detailErrorResponse(res, 403, "cannot invite: user is already an attendee of this event");
            } else if (access_state.is_invitee && access_state.invite.status === db.EventInvite.STATUS_PENDING) {
                return util.detailErrorResponse(res, 403, "cannot invite: user has already been invited");
            } else if (access_state.is_requester && access_state.request.status === db.EventJoinRequest.STATUS_REJECTED) {
                return util.detailErrorResponse(res, 403, "cannot invite: the user has already been rejected from this event");
            }

            const invite_pk = {
                id_event: eid,
                id_invitee: req.body.id_invitee,
            };

            let queries = []; // queries to execute to handle the send invite
            if (access_state.is_requester) { // cannot be a rejected requester at this point, so add to attendees
                access_state.request.status = db.EventJoinRequest.STATUS_ACCEPTED;
                queries.push(access_state.request.save({ transaction }));
                queries.push(create_attendee(req.body.id_invitee, eid, transaction));
                queries.push(create_invitee(invite_pk, current_uid, db.EventInvite.STATUS_ACCEPTED, transaction));
            } else {
                queries.push(db.EventInvite.upsert({  // upsert to handle rejected invite requests
                    ... invite_pk,
                    id_inviter: current_uid,
                    status: db.EventInvite.STATUS_PENDING
                }, { transaction }))
            }

            return Promise.all(queries).then(() => {
                return util.sendModelOrError(res, db.EventInvite.findOne({
                    where: invite_pk, transaction,
                    include: exports.eventInviteIncludes
                }));
            });
        });
    }).catch(err => {
        return util.detailErrorResponse(res, 500, err);
    });
};

exports.handleEventInvite = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    const eid = parseInt(req.params.eid);
    return db.sequelize.transaction(transaction => {
        return fetch_event_access_state(current_uid, eid, transaction).then(access_state => {
            if (!access_state.is_invitee) {
                return util.detailErrorResponse(res, 404, "cannot handle invite: no such invite");
            } else if (access_state.is_attendee) { // takes in to account the case "invite status === ACCEPTED"
                return util.detailErrorResponse(res, 403, "cannot handle invite: the user is already an attendee");
            }

            let queries = [ ];
            if (req.body.accept) {
                queries.push(create_attendee(current_uid, eid, transaction));
                access_state.invite.status = db.EventInvite.STATUS_ACCEPTED;
            } else {
                access_state.invite.status = db.EventInvite.STATUS_REJECTED;
            }
            queries.push(access_state.invite.save({ transaction }));

            return Promise.all(queries).then(() => {
                return util.sendModelOrError(res, db.EventInvite.findOne({ where: {
                    id_event: eid,
                    id_invitee: current_uid
                }, transaction, include: exports.eventInviteIncludes }));
            });
        });
    }).catch(err => {
        return util.detailErrorResponse(res, 500, err);
    });
};

exports.listJoinRequests = function(req, res) {
    let where = {};
    if (req.query.status !== undefined) {
        where = {
            status: { [db.Op.in]: req.query.status.map(s => s.toUpperCase()) },
            ... where
        }
    }
    return util.sendModelOrError(res, db.EventJoinRequest.findAll({ where, include: exports.eventJoinRequestIncludes }));
};

exports.sendJoinRequest = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    const eid = parseInt(req.params.eid);
    return db.sequelize.transaction(transaction => {
        return fetch_event_access_state(current_uid, eid, transaction).then(access_state => {
            if (access_state.is_attendee) {
                return util.detailErrorResponse(res, 403, 'cannot send join request: is already an attendee');
            } else if (access_state.is_requester && access_state.request.status === db.EventJoinRequest.STATUS_PENDING) {
                return util.detailErrorResponse(res, 403, 'cannot send join request: a request has already been sent');
            } else if (access_state.is_requester && access_state.request.status === db.EventJoinRequest.STATUS_REJECTED) {
                return util.detailErrorResponse(res, 403, 'cannot send join request: the user has already been rejected from this event');
            }

            let queries = [];
            const request_pk = {
                id_requester: current_uid,
                id_event: eid
            };
            if (access_state.is_invitee && access_state.invite.status === db.EventInvite.STATUS_PENDING) {
                access_state.invite.status = db.EventInvite.STATUS_ACCEPTED;
                queries.push(access_state.invite.save({ transaction }));
                queries.push(create_attendee(current_uid, eid, transaction));
                queries.push(create_join_request(request_pk, db.EventInvite.STATUS_ACCEPTED, transaction));
            } else if (access_state.event.user_can_join) {
                queries.push(create_attendee(current_uid, eid, transaction));
                queries.push(create_join_request(request_pk, db.EventInvite.STATUS_ACCEPTED, transaction));
            } else if (!access_state.event.user_can_join) {
                queries.push(create_join_request(request_pk, db.EventInvite.STATUS_PENDING, transaction));
            } else if (access_state.event.visibility === db.Event.VISIBILITY_SECRET || access_state.event.invite_required) {
                return util.detailErrorResponse(res, 403, 'cannot send join request');
            }

            return Promise.all(queries).then(() => {
                return util.sendModelOrError(res, db.EventJoinRequest.findOne({
                    where: request_pk, transaction,
                    include: exports.eventJoinRequestIncludes
                }));
            })
        });
    }).catch(err => {
        console.log(err);
        return util.detailErrorResponse(res, 500, err);
    });
};

exports.handleJoinRequest = function(req, res) {
    const eid = parseInt(req.params.eid);
    return db.sequelize.transaction(transaction => {
        return fetch_event_access_state(req.body.id_requester, eid, transaction).then(access_state => {
            if (!access_state.is_requester) {
                return util.detailErrorResponse(res, 404, "cannot handle join request: no such request");
            } else if (access_state.is_attendee) {
                return util.detailErrorResponse(res, 403, "cannot handle join request: the user is already an attendee");
            } else if (access_state.is_requester && access_state.request.status === db.EventJoinRequest.STATUS_REJECTED) {
                return util.detailErrorResponse(res, 403, 'cannot handle join request: the user has already been rejected from this event');
            }

            let queries = [ ];
            if (req.body.accept) {
                queries.push(create_attendee(req.body.id_requester, eid, transaction));
                access_state.request.status = db.EventJoinRequest.STATUS_ACCEPTED;
            } else {
                access_state.request.status = db.EventJoinRequest.STATUS_REJECTED;
            }
            queries.push(access_state.request.save({ transaction }));

            return Promise.all(queries).then(() => {
                return util.sendModelOrError(res, db.EventJoinRequest.findOne({ where: {
                    id_requester: req.body.id_requester,
                    id_event: eid
                }, transaction, include: exports.eventJoinRequestIncludes }));
            });
        });
    }).catch(err => {
        console.log(err);
        return util.detailErrorResponse(res, 500, err);
    });
};

exports.subscribeToEvent = function(req, res) {
    const eid = parseInt(req.params.eid);
    const current_uid = userutil.getCurrUserId(req);
    return db.sequelize.transaction(transaction => {
        return fetch_event_access_state(current_uid, eid, transaction).then(access_state => {
            if (access_state.is_attendee) {
                return util.detailErrorResponse(res, 403, "cannot join this event: already an attendee");
            }

            let queries = [];
            if (access_state.is_invitee && access_state.invite.status !== db.EventInvite.STATUS_ACCEPTED) {
                access_state.invite.status = db.EventInvite.STATUS_ACCEPTED;
                queries.push(access_state.invite.save({ transaction }));
            } else if (access_state.is_requester && access_state.request.status === db.EventInvite.STATUS_PENDING) {
                access_state.request.status = db.EventJoinRequest.STATUS_ACCEPTED;
                queries.push(access_state.request.save({ transaction }));
            } else if (access_state.event.visibility === db.Event.VISIBILITY_SECRET || access_state.event.invite_required || !access_state.event.user_can_join) {
                return util.detailErrorResponse(res, 403, "cannot join this event");
            }

            queries.push(create_attendee(current_uid, eid, transaction));

            return Promise.all(queries).then(() => {
                return util.sendSuccessObj(res);
            });
        });
    }).catch(err => {
        return util.detailErrorResponse(res, 500, err);
    });
};

exports.deleteEventAttendee = function(req, res) {
    const eid = parseInt(req.params.eid);
    const uid = parseInt(req.params.uid);
    return db.sequelize.transaction(transaction => {
        return db.EventAttendee.destroy({ where: { id_user: uid, id_event: eid }, transaction }).then(count => {
            if (count === 0) {
                return EventController.sendEventAttendees(eid, res, { transaction });
            }
            // delete invite and request data
            return Promise.all([
                db.EventJoinRequest.destroy({ where: {
                    id_requester: uid, id_event: eid,
                    status: { [db.Op.ne]: db.EventJoinRequest.STATUS_REJECTED }
                }, transaction }),
                db.EventInvite.destroy({ where: { id_invitee: uid,  id_event: eid } , transaction })
            ]).then(() => {
                return EventController.sendEventAttendees(eid, res, { transaction });
            });
        });
    }).catch(err => {
        return util.detailErrorResponse(res, 500, err);
    });
};