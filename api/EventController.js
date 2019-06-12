const db = require("./models/index");
const util = require("./util/util");
const userutil = require("./util/user");
const moment = require("moment");
const m2m = require("./util/m2m_helpers");
const includes = require("./util/db_include");
const BoardGameController = require("./BoardGameController");
const { validationResult } = require('express-validator/check');
const Activity = require("./util/activities");

const eventFullIncludeSQ = [
    includes.genericIncludeSQ(db.EventAttendee, "attendees", [includes.getShallowUserIncludeSQ("user")]),
    includes.genericIncludeSQ(db.ProvidedBoardGame, "provided_board_games", [
        includes.getBoardGameIncludeSQ("provided_board_game"),
        includes.getShallowUserIncludeSQ("provider")
    ]),
    // Disabled because makes the request too slow ! Use /event/:eid/games instead.
    // includes.getGameIncludeSQ("games", [includes.defaultBoardGameIncludeSQ]),
    includes.getShallowUserIncludeSQ("creator")
];

exports.createEvent = function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return util.detailErrorResponse(res, 400, "cannot create event", errors);
    }
    return util.sendModelOrError(res, db.Event.create({
        name: req.body.name,
        location: req.body.location,
        start: req.body.start.utc(),
        end: req.body.end.utc(),
        id_creator: userutil.getCurrUserId(req),
        description: req.body.description,
        hide_rankings: req.body.hide_rankings || false,
        attendees_can_edit: req.body.attendees_can_edit || true,
        visibility: req.body.visibility || db.Event.VISIBILITY_SECRET,
        invite_required: req.body.invite_required || true
    }));
};

exports.updateEvent = function(req, res) {
    return db.Event.findByPk(parseInt(req.params.eid)).then(event => {
        if (event.id_creator !== userutil.getCurrUserId(req)) {
            return util.detailErrorResponse(res, 403, "only the event creator can update the event");
        }
        event.description = req.body.description || event.description;
        event.name = req.body.name || event.name;
        event.location = req.body.location || event.location;
        event.start = req.body.start ? req.body.start.utc() : event.start;
        event.end = req.body.end ? req.body.end.utc() : event.end;
        event.hide_rankings = req.body.hide_rankings === undefined ? event.hide_rankings : req.body.hide_rankings;
        event.visibility = req.body.visibility || event.visibility;
        event.attendees_can_edit = req.body.attendees_can_edit === undefined ? event.attendees_can_edit : req.body.attendees_can_edit;
        event.invite_required = req.body.invite_required === undefined ? event.invite_required : req.body.invite_required;
        return util.sendModelOrError(res, event.save());
    }).catch(err => {
        return util.detailErrorResponse(res, 404, "no such event")
    })
};

exports.getEvent = function(req, res) {
    return util.sendModelOrError(res, db.Event.findByPk(parseInt(req.params.eid)));
};

exports.getFullEvent = function(req, res) {
    return util.sendModelOrError(res, db.Event.findOne({
        where: {id: parseInt(req.params.eid)},
        include: eventFullIncludeSQ
    }));
};

exports.getCurrentUserEvents = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    // access right criterion
    const attendee_request = db.selectFieldQuery("EventAttendees", "id_event", { id_user: current_uid });
    const invitee_request = db.selectFieldQuery("EventInvites", "id_event", { id_invitee: current_uid, status: db.EventInvite.STATUS_PENDING });
    let where = { [db.Op.or]: [
        { visibility: db.Event.VISIBILITY_PUBLIC },
        { id_creator: current_uid },
        { id: { [db.Op.in]: db.sequelize.literal('(' + attendee_request + ')') }}, // attendee
        { id: { [db.Op.in]: db.sequelize.literal('(' + invitee_request + ')') }} // invitee
    ]};
    // registered or not ?
    if (req.query.registered !== undefined) {
        where = {
            id: req.query.registered ? { [db.Op.in]: db.sequelize.literal('(' + attendee_request + ')')} :
                    { [db.Op.notIn]: db.sequelize.literal('(' + attendee_request + ')') },
            ... where
        }
    }
    // ongoing or not ?
    if (req.query.ongoing !== undefined) {
        let between = {
            start: {[db.Op.lte]: db.Sequelize.fn("date", db.Sequelize.fn("now"))},
            end: {[db.Op.gte]: db.Sequelize.fn("date", db.Sequelize.fn("now"))}
        };
        where = {
            ... db.negateIf(req.query.ongoing, {[db.Op.and] : between}),
            ... where
        }
    }
    // visibility ?
    if (req.query.visibility) {
        where = {
            visibility: {[db.Op.in]: req.query.visibility.map(s => s.toUpperCase())},
            ... where,
        };
    }
    return util.sendModelOrError(res, db.Event.findAll({ where, include: [
        includes.getShallowUserIncludeSQ("creator")
    ]}));
};

exports.deleteEvent = function(req, res) {
    let eid = parseInt(req.params.eid);
    return db.Event.destroy({
        where: {id: eid, id_creator: userutil.getCurrUserId(req)}  // restrict suppression of events to the creator
    }).then(count => {
        if (count === 0) {
            return util.detailErrorResponse(res, 403, "you must be the creator of the event to delete it, and the event must exist");
        } else {
            return util.successResponse(res, util.successObj);
        }
    });
};

exports.sendProvidedBoardGames = function(eid, res) {
    return util.sendModelOrError(res, db.ProvidedBoardGame.findAll({
        where: { id_event: eid },
        include: [
            includes.getUserIncludeSQ("provider"),
            includes.getBoardGameIncludeSQ("provided_board_game")
        ]
    }));
};

exports.addProvidedBoardGames = function(req, res) {
    let eid = parseInt(req.params.eid);
    let userId = userutil.getCurrUserId(req);
    let board_games = req.body.board_games.map(g => { return { id_user: userId, id_board_game: g, id_event: eid }});
    return db.ProvidedBoardGame.bulkCreate(board_games, { ignoreDuplicates: true }).then(() => {
        return exports.sendProvidedBoardGames(eid, res);
    }).catch(err => {
        return util.errorResponse(res);
    });
};

exports.getProvidedBoardGames = function(req, res) {
    let eid = parseInt(req.params.eid);
    return exports.sendProvidedBoardGames(eid, res);
};

exports.deleteProvidedBoardGames = function(req, res) {
    let eid = parseInt(req.params.eid);
    return util.handleDeletion(res, db.ProvidedBoardGame.destroy({
        where: {
            id_event: eid,
            id_user: userutil.getCurrUserId(req),
            id_board_game: req.body.board_games
        }
    }));
};

exports.sendEventAttendees = function(eid, res) {
    return m2m.sendAssociations(res, {
        model_class: db.EventAttendee,
        fixed: { id: eid, field: 'id_event' },
        other: { includes: [includes.getShallowUserIncludeSQ("user")] }
    });
};

exports.getEventAttendees = function(req, res) {
    return exports.sendEventAttendees(parseInt(req.params.eid), res);
};

exports.addEventAttendees = function(req, res) {
    return m2m.addAssociations(req, res, {
        model_class: db.EventAttendee,
        fixed: { id: parseInt(req.params.eid), field: 'id_event' },
        other: {
            ids: req.body.users,
            field: 'id_user',
            includes: [includes.getShallowUserIncludeSQ("user")]
        },
        error_message: 'cannot add attendees'
    });
};

exports.deleteEventAttendees = function(req, res) {
    return m2m.deleteAssociations(req, res, {
        model_class: db.EventAttendee,
        fixed: { id: parseInt(req.params.eid), field: 'id_event' },
        other: {
            ids: req.body.users,
            field: 'id_user',
            includes: [includes.getShallowUserIncludeSQ("user")]
        }
    });
};

exports.subscribeToEvent = function(req, res) {
    return db.Event.findByPk(parseInt(req.params.eid)).then(event => {
        if (event.invite_required) {
            return util.detailErrorResponse(res, 403, "cannot join this event, invite required");
        }
        return m2m.addAssociations(req, res, {
            model_class: db.EventAttendee,
            fixed: { id: parseInt(req.params.eid), field: 'id_event' },
            other: {
                ids: [userutil.getCurrUserId(req)],
                field: 'id_user',
                includes: [includes.getShallowUserIncludeSQ("user")]
            },
            error_message: 'cannot add current user as attendee'
        });
    }).catch(err => {
        return util.detailErrorResponse(res, 500, "cannot subscribe");
    });
};

exports.addBoardGameAndAddToEvent = function(req, res) {
    const idEvent = parseInt(req.params.eid);
    const createFn = (board_game, req, res) => {
        return db.ProvidedBoardGame.create({
            id_user: userutil.getCurrUserId(req),
            id_board_game: board_game.id,
            id_event: idEvent
        }, {ignoreDuplicates: true}).then(l => {
            return exports.sendProvidedBoardGames(idEvent, res);
        }).catch(err => {
            return util.errorResponse(res);
        });
    };
    const bggId = parseInt(req.params.id);
    const source = req.params.source;
    return BoardGameController.executeIfBoardGameExists(bggId, source, req, res, createFn);
};

exports.getEventStats = function(req, res) {
    const GameController = require("./GameController");
    const eid = parseInt(req.params.eid);
    return util.sendModelOrError(res, Promise.all([
        db.Game.count({where: {id_event: eid}}),
        db.Game.count({
            where: {id_event: eid},
            distinct: true,
            col: 'id_board_game'
        }),
        db.Game.sum('duration', { where: {id_event: eid} }),
        db.ProvidedBoardGame.count({
            where: {id_event: eid},
            distinct: true,
            col: 'id_board_game'
        }),
        db.Game.findOne({
            where: {id_event: eid, duration: {[db.Op.ne]: null}},
            order: [['duration', 'DESC']],
            include: GameController.gameFullIncludesSQ
        }),
        db.Game.findOne({
            where: {id_event: eid},
            attributes: ['id_board_game', [db.sequelize.fn('count', 'id_board_game'), 'count']],
            raw: true,
            order: [['count', 'DESC']],
            group: 'id_board_game'
        }).then(data => {
            if (data) {
                return Promise.all([
                    new Promise((resolve) => resolve(parseInt(data.count))),
                    db.BoardGame.findByPk(data.id_board_game)
                ]);
            } else {
                return new Promise((resolve) => resolve([0, null]));
            }
        })
    ]), values => {
        return {
            games_played: values[0],
            board_games_played: values[1],
            minutes_played: values[2],
            provided_board_games: values[3],
            longest_game: values[4] ? GameController.fromGamePlayersToRanks(values[4]) : null,
            most_played: { count: values[5][0], board_game: values[5][1] }
        }
    });
};

exports.getEventActivities = function(req, res) {
    const eid = parseInt(req.params.eid);
    return util.sendModelOrError(res, Activity.getEventActivitiesPromise(eid, 10));
};

exports.getEventMatchmaking = function(req, res) {
    const uid = userutil.getCurrUserId(req);
    const eid = parseInt(req.params.eid);
    const provided_query = db.selectFieldQuery("ProvidedBoardGames", "id_board_game", { id_event: eid });
    return db.WishToPlayBoardGame.findAll({
        attributes: ['id_board_game'],
        where: {
            id_user: uid,
            id_board_game: { [db.Op.in]: db.sequelize.literal('(' + provided_query + ')') }
        }
    }).then(data => {
        /**
         * `data` is a list of ids of board games that were brought to an event and that are in the
         * wish to play list of the current user.
         */
        const attendees_query = db.selectFieldQuery("EventAttendees", "id_user", { id_event: eid });
        return util.sendModelOrError(res, db.WishToPlayBoardGame.findAll({
            where: {
                id_board_game: { [db.Op.in]: data.map(d => d.id_board_game )},
                id_user: { [db.Op.and]: [
                        { [db.Op.ne]: uid },
                        { [db.Op.in]: db.sequelize.literal('(' + attendees_query + ')') }
                    ]
                }
            },
            include: [
                includes.getShallowUserIncludeSQ("user"),
                includes.defaultBoardGameIncludeSQ
            ]
        }), function(data) {
            /** transform the list of board game and users into a list of baord games with interested users */
            let matchmaking = [];
            let board_game_index = {};
            data.forEach(({id_board_game, id_user, user, board_game}) => {
                if (id_board_game in board_game_index) {
                    matchmaking[board_game_index[id_board_game]].users.push(user);
                } else {
                    board_game_index[id_board_game] = matchmaking.length;
                    matchmaking.push({
                        board_game: board_game,
                        users: [user]
                    });
                }
            });
            return matchmaking;
        });
    }).catch(err => {
        return res.status(500).json({['err']: 'err'});
    });
};

exports.getEventWishToPlayGames = function(req, res) {
    // secondary query for user filtering: attendees and (if indicated) not current user
    const eid = parseInt(req.params.eid);
    const user_filtering_query = db.selectFieldQuery("EventAttendees", "id_user", {
        id_event: eid,
        ... (!req.query.exclude_current ? {} : { id_user: { [db.Op.ne]: userutil.getCurrUserId(req) } })
    });
    const board_games_filtering_query = db.selectFieldQuery("ProvidedBoardGames", 'id_board_game', {
        id_event: eid
    });

    let where = { id_user: { [db.Op.in]: db.sequelize.literal('(' + user_filtering_query + ')') } };
    if (req.query.provided_games_only) { // also filter out board games which were not provided
        where.id_board_game = {[db.Op.in]: db.sequelize.literal('(' + board_games_filtering_query + ')') };
    }

    return util.sendModelOrError(res, db.WishToPlayBoardGame.findAll({
        attributes: ['id_board_game', [db.sequelize.fn('count', 'id_user'), 'count']],
        where,
        include: [{ attribute: [], ...includes.defaultBoardGameIncludeSQ }],
        group: ['WishToPlayBoardGame.id_board_game', 'board_game.id']
    }));
};

exports.eventInviteIncludes = [
    includes.getShallowUserIncludeSQ('inviter'),
    includes.getShallowUserIncludeSQ('invitee'),
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
        return db.EventAttendee.count({ where: { id_user: current_uid, id_event: eid }, transaction }).then(attendee_count => {
            if (attendee_count > 0) {
                return util.detailErrorResponse(res, 403, "cannot invite: user is already an attendee of this event");
            }
            return util.sendModelOrError(res, db.EventInvite.create({
                id_event: eid,
                id_sender: current_uid,
                id_recipient: req.body.id_recipient,
                status: db.EventInvite.STATUS_PENDING
            }, {
                include: exports.eventInviteIncludes,
                transaction
            }));
        })
    });
};

exports.handleEventInvite = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    const eid = parseInt(req.params.eid);
    return db.sequelize.transaction(transaction => {
        return db.EventInvite.findOne({
            where: {
                id_event: eid,
                id_sender: req.body.id_sender,
                id_recipient: current_uid
            },
            include: exports.eventInviteIncludes,
            transaction
        }).then(async invite => {
            if (!invite) {
                return util.detailErrorResponse(res, 404, "no such event invite");
            } else if (invite.status !== db.EventInvite.STATUS_PENDING) {
                return util.detailErrorResponse(res, 403, "request has already been handled");
            }
            invite.status = req.body.accept ? db.EventInvite.STATUS_ACCEPTED : db.EventInvite.STATUS_REJECTED;
            let requests = [invite.save({ transaction })];
            if (req.body.accept) {
                requests.push(m2m.addAssociations(req, res, {
                    model_class: db.EventAttendee,
                    fixed: { id: eid, field: 'id_event' },
                    other: {
                        ids: [current_uid],
                        field: 'id_user'
                    },
                    error_message: 'cannot add current user as attendee',
                    options: { transaction }
                }));
            }

            return util.sendModelOrError(res, Promise.all(requests), results => results[0]);
        });
    }).catch(err => {
        return util.detailErrorResponse(res, 500, "cannot handle event invite");
    });
};
