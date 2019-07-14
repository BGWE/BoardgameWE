const db = require("./models/index");
const util = require("./util/util");
const userutil = require("./util/user");
const includes = require("./util/db_include");
const BoardGameController = require("./BoardGameController");
const Activity = require("./util/activities");
const m2m = require("./util/m2m_helpers");

const eventFullIncludeSQ = [
    includes.genericIncludeSQ(db.ProvidedBoardGame, "provided_board_games", [
        includes.getBoardGameIncludeSQ("provided_board_game"),
        includes.getShallowUserIncludeSQ("provider")
    ]),
    includes.genericIncludeSQ(db.EventAttendee, "attendees", [includes.getShallowUserIncludeSQ("user")]),
    // Disabled because makes the request too slow ! Use /event/:eid/games instead.
    // includes.getGameIncludeSQ("games", [includes.defaultBoardGameIncludeSQ]),
    includes.getShallowUserIncludeSQ("creator")
];

exports.createEvent = function(req, res) {
    const visibility = req.body.visibility || db.Event.VISIBILITY_SECRET;
    const is_secret = visibility === db.Event.VISIBILITY_SECRET;
    return util.sendModelOrError(res, db.Event.create({
        name: req.body.name,
        location: req.body.location,
        start: req.body.start.utc(),
        end: req.body.end.utc(),
        id_creator: userutil.getCurrUserId(req),
        description: req.body.description,
        hide_rankings: util.boolOrDefault(req.body.hide_rankings, false),
        visibility,
        attendees_can_edit: util.boolOrDefault(req.body.attendees_can_edit, true),
        invite_required: is_secret ? true : util.boolOrDefault(req.body.invite_required, true),
        user_can_join: util.boolOrDefault(req.body.user_can_join, false)
    }).then(async event => {
        if (util.boolOrDefault(req.query.auto_join, false)) {
            await db.EventAttendee.create({
                id_user: userutil.getCurrUserId(req),
                id_event: event.id
            });
        }
        return event;
    }));
};

exports.updateEvent = function(req, res) {
    const visibility = req.body.visibility || event.visibility;
    const is_secret = visibility === db.Event.VISIBILITY_SECRET;
    return db.Event.findByPk(parseInt(req.params.eid)).then(event => {
        event.description = req.body.description || event.description;
        event.name = req.body.name || event.name;
        event.location = req.body.location || event.location;
        event.start = req.body.start ? req.body.start.utc() : event.start;
        event.end = req.body.end ? req.body.end.utc() : event.end;
        event.hide_rankings = util.boolOrDefault(req.body.hide_rankings, event.hide_rankings);
        event.visibility = visibility;
        event.attendees_can_edit = util.boolOrDefault(req.body.attendees_can_edit, event.attendees_can_edit);
        event.invite_required = is_secret ? true : util.boolOrDefault(req.body.invite_required, event.invite_required);
        event.user_can_join = util.boolOrDefault(req.body.user_can_join, event.user_can_join);
        return util.sendModelOrError(res, event.save());
    }).catch(err => {
        return util.detailErrorResponse(res, 404, "no such event")
    })
};

exports.getEvent = function(req, res) {
    return util.sendModelOrError(res, db.Event.findByPk(parseInt(req.params.eid)));
};

exports.getFullEvent = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    return Promise.all([
        db.Event.findOne({
            where: {id: parseInt(req.params.eid)},
            include: eventFullIncludeSQ
        }),
        db.Event.findOne({
            where: {id: parseInt(req.params.eid)},
            include: includes.getEventUserAccessIncludes(current_uid)
        })
    ]).then(values => {
        let event = values[0];
        let eventWithAccess = values[1];
        event.dataValues.current = includes.formatRawEventWithUserAccess(current_uid, eventWithAccess).dataValues.current;
        return util.successResponse(res, event)
    });

};

exports.fetchEventsWithUserAccess = function(id_user, where) {
    return db.Event.findAll({
        where,
        include: [ includes.getShallowUserIncludeSQ("creator") ].concat(includes.getEventUserAccessIncludes(id_user))
    }).then(events => {
        return events.map(e => includes.formatRawEventWithUserAccess(id_user, e));
    });
};

exports.getCurrentUserEvents = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    // access right criterion
    const attendee_request = db.selectFieldQuery("EventAttendees", "id_event", { id_user: current_uid });
    const invitee_request = db.selectFieldQuery("EventInvites", "id_event", { id_invitee: current_uid, status: db.EventInvite.STATUS_PENDING });
    let where = { [db.Op.or]: [
        { visibility: { [db.Op.ne]: db.Event.VISIBILITY_SECRET } },
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
    return util.sendModelOrError(res, exports.fetchEventsWithUserAccess(current_uid, where));
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

exports.sendProvidedBoardGames = function (eid, res) {
  return util.sendModelOrError(res, db.ProvidedBoardGame.findAll({
    where: {id_event: eid},
    include: [
      includes.getUserIncludeSQ("provider"),
      includes.getBoardGameIncludeSQ("provided_board_game", [
        BoardGameController.boardGameIncludes
      ])
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

exports.sendEventAttendees = function(req, eid, res, options) {
    options = options || {};
    return m2m.sendAssociations(res, {
        model_class: db.EventAttendee,
        fixed: { id: eid, field: 'id_event' },
        other: { includes: [includes.getShallowUserIncludeSQ("user")] },
        options: { ... options }
    });
};

exports.getEventAttendees = function(req, res) {
    return exports.sendEventAttendees(req, parseInt(req.params.eid), res);
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
