const db = require("../models/index");

/**
 * List of excluded attributes in the user model. Those should not be returned by the API.
 * @type {string[]}
 */
exports.userExcludedAttributes = ["password", "validated"];
exports.userShallowAttributes = ["name", "surname", "username", "id"];

/**
 *
 * @param model Sequelize model to be included
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}} And possibly a include field
 */
exports.genericIncludeSQ = function(model, as, includes) {
    if (!includes) {
        return {model: model, as: as}
    } else {
        return {model: model, as: as, include: includes}
    }
};

/**
 * Generates an include object for events
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}}
 */
exports.getEventIncludeSQ = function(as, includes) {
    return exports.genericIncludeSQ(db.Event, as, includes);
};

/**
 * Generates an include object for board games
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}}
 */
exports.getBoardGameIncludeSQ = function(as, includes) {
    return exports.genericIncludeSQ(db.BoardGame, as, includes);
};

/**
 * Generates an include object for users
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *, attributes: {exclude: string[]}}}
 */
exports.getUserIncludeSQ = function(as, includes) {
    let base_include = exports.genericIncludeSQ(db.User, as, includes);
    return Object.assign({attributes: {exclude: exports.userExcludedAttributes}}, base_include);
};

/**
 * Return includes coming with event for getting access information
 * @param id_user
 * @returns {*[]}
 */
exports.getEventUserAccessIncludes = function(id_user) {
    return [{
        attributes: ["id_event"], where: {id_user}, required: false,
        ... exports.genericIncludeSQ(db.EventAttendee, 'attendees')
    }, {
        attributes: ["id_event", "status"], required: false,
        where: {id_requester: id_user},
        ... exports.genericIncludeSQ(db.EventJoinRequest, 'requesters'),
    }, {
        attributes: ["id_event", "status"], required: false,
        where: {id_invitee: id_user},
        ... exports.genericIncludeSQ(db.EventInvite, 'invitees'),
    }]
};

/**
 * Format current object of an event that was fetched with event user access includes.
 * @param id_user
 * @param event
 * @returns {*}
 */
exports.formatRawEventWithUserAccess = function(id_user, event) {
    let current = {};
    current.is_attendee = event.attendees.length > 0;
    current.is_invitee = event.invitees.length > 0 && event.invitees[0].status === db.EventInvite.STATUS_PENDING;
    current.is_requester = event.requesters.length > 0 && event.requesters[0].status === db.EventJoinRequest.STATUS_PENDING;
    current.is_rejected = event.requesters.length > 0 && event.requesters[0].status === db.EventJoinRequest.STATUS_REJECTED;
    current.is_creator = event.id_creator === id_user;
    current.can_join = !current.is_attendee && (
        current.is_creator
        || current.is_invitee
        || (
            event.visibility !== db.Event.VISIBILITY_SECRET
            && !event.invite_required
            && event.user_can_join
            && !current.is_rejected
        )
    );
    current.can_request = !current.is_attendee && !current.is_requester && (
        current.is_creator
        || current.is_invitee
        || (
            event.visibility !== db.Event.VISIBILITY_SECRET
            && !event.invite_required
            && !event.user_can_join
            && !current.is_rejected
        )
    );
    current.can_write = current.is_creator || (event.attendees_can_edit && current.is_attendee);
    current.can_read = current.is_creator || current.is_attendee || current.is_invitee || event.visibility === db.Event.VISIBILITY_PUBLIC;

    event.dataValues.current = current;
    event.dataValues.attendees = undefined;
    event.dataValues.invitees = undefined;
    event.dataValues.requesters = undefined;
    return event;
};

/**
 * Generates an include object for users
 * @param as Name of the inclusion
 * @returns {{model: *, as: *, attributes: string[]}}
 */
exports.getShallowUserIncludeSQ = function(as) {
    let base_include = exports.genericIncludeSQ(db.User, as);
    return { attributes: exports.userShallowAttributes, ...base_include };
};

/**
 * Returns includes necessary for friendship request
 * @param current_uid
 * @returns {*[]}
 */
exports.getFriendshipIncludesSQ = function(current_uid) {
    return [
        { ... exports.genericIncludeSQ(db.Friendship, "friend1"), where: {id_user2: current_uid}, required: false },
        { ... exports.genericIncludeSQ(db.Friendship, "friend2"), where: {id_user1: current_uid}, required: false },
        { ... exports.genericIncludeSQ(db.FriendshipRequest, "request_user_from"), where: {
            id_user_to: current_uid,
            status: db.FriendshipRequest.STATUS_PENDING
        }, required: false },
        { ... exports.genericIncludeSQ(db.FriendshipRequest, "request_user_to"), where: {
            id_user_from: current_uid,
            status: db.FriendshipRequest.STATUS_PENDING
        }, required: false }
    ];
};

/**
 * Return a shallow user include with current user friendship status
 * @param as
 * @param current_uid
 * @returns {{model: *, as: *, attributes: string[], include: []}}
 */
exports.getShallowUserIncludeSQWithFriendInfo = function(as, current_uid) {
    let shallow = exports.getShallowUserIncludeSQ(as);
    shallow.include = exports.getFriendshipIncludesSQ(current_uid);
    return shallow;
};

/**
 * Reformat a user descriptor obtained with friendship includes
 * @param u
 * @param current_uid
 * @returns {*}
 */
exports.formatShallowUserWithCurrent = function(u, current_uid) {
    let current = {};
    current.is_friend = u.friend1.length > 0 || u.friend2.length > 0;
    current.has_sent_friendship_request = u.request_user_to.length > 0;
    current.has_received_friendship_request = u.request_user_from.length > 0;
    if (current_uid) {
        current.is_current = current_uid === u.id;
    }
    // clean old fields
    u.dataValues.friend1 = undefined;
    u.dataValues.friend2 = undefined;
    u.dataValues.request_user_from = undefined;
    u.dataValues.request_user_to = undefined;
    u.dataValues.current = current;
    return u;
};

/**
 * Generates an include object for games
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}}
 */
exports.getGameIncludeSQ = function(as, includes) {
    return exports.genericIncludeSQ(db.Game, as, includes);
};


/**
 * Default include for event as 'event'
 * @type {{model: *, as: "event"}}
 */
exports.defaultEventIncludeSQ = exports.getEventIncludeSQ("event");

/**
 * Default include for user as 'user' (with excluded fields).
 * @type {{model: *, as: "user", attributes: {exclude: string[]}}}
 */
exports.defaultUserIncludeSQ = exports.getUserIncludeSQ("user");

/**
 * Default include for board_game as 'board_game'.
 * @type {{model: *, as: "board_game"}}
 */
exports.defaultBoardGameIncludeSQ = exports.getBoardGameIncludeSQ("board_game");

/**
 * Default include for game as 'game'
 * @type {{model: *, as: "game"}}
 */
exports.defaultGameIncludeSQ = exports.getGameIncludeSQ("game");