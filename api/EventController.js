const db = require("./models/index");
const util = require("./util/util");
const userutil = require("./util/user");
const moment = require("moment");
const includes = require("./util/db_include");
const BoardGameController = require("./BoardGameController");

const eventFullIncludeSQ = [
    includes.genericIncludeSQ(db.EventAttendee, "attendees", [includes.defaultUserIncludeSQ]),
    includes.genericIncludeSQ(db.ProvidedBoardGame, "provided_board_games", [
        includes.getBoardGameIncludeSQ("provided_board_game"),
        includes.getUserIncludeSQ("provider")
    ]),
    // Disabled because makes the request too slow ! Use /event/:eid/games instead.
    // includes.getGameIncludeSQ("games", [includes.defaultBoardGameIncludeSQ]),
    includes.getUserIncludeSQ("creator")
];

exports.createEvent = function(req, res) {
    // validate date
    let start = moment.utc(req.body.start, moment.ISO_8601);
    let end = moment.utc(req.body.end, moment.ISO_8601);
    if (!(start.isValid() && end.isValid() && start.isBefore(end)) && req.body.name && req.body.name.length > 0) {
        return res.status(403).send({error: "invalid dates or name"})
    }
    return util.sendModelOrError(res, db.Event.create({
        name: req.body.name,
        location: req.body.location,
        start: start.toDate(),
        end: end.toDate(),
        id_creator: userutil.getCurrUserId(req),
        description: req.body.description
    }));
};

exports.getEvent = function(req, res) {
    return util.sendModelOrError(res, db.Event.findById(parseInt(req.params.eid)));
};

exports.getFullEvent = function(req, res) {
    return util.sendModelOrError(res, db.Event.find({
        where: {id: parseInt(req.params.eid)},
        include: eventFullIncludeSQ
    }));
};

exports.getAllEvents = function(req, res) {
    let where = {};
    let currIncludes = [];
    if (req.query.ongoing !== undefined) {
        let between = {
            start: {[db.Sequelize.Op.lte]: db.Sequelize.fn("date", db.Sequelize.fn("now"))},
            end: {[db.Sequelize.Op.gte]: db.Sequelize.fn("date", db.Sequelize.fn("now"))}
        };
        if (req.query.ongoing) {
            where[db.Sequelize.Op.and] = between;
        } else {
            where[db.Sequelize.Op.not] = {[db.Sequelize.Op.and] : between};
        }
    }
    if (req.query.registered !== undefined) {
        let attendeeInclude = includes.genericIncludeSQ(
            db.EventAttendee,
            "attendees"
        );
        attendeeInclude.attributes = [];
        where["$attendees.id_user$"]= util.parseList(req.query.registered, parseInt, ",");
        currIncludes = [attendeeInclude];
    }
    return util.sendModelOrError(res, db.Event.findAll({ where: where, include: currIncludes }));
};

exports.deleteEvent = function(req, res) {
    let eid = parseInt(req.params.eid);
    return util.handleDeletion(res, db.Event.destroy({
        where: {id: eid, id_creator: userutil.getCurrUserId(req)}  // restrict suppression of events to the creator
    }));
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
    return db.ProvidedBoardGame.bulkCreate(board_games, { ignoreDuplicates: true })
        .then(() => {
            return exports.sendProvidedBoardGames(eid, res);
        })
        .catch(err => {
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
    return util.sendModelOrError(res, db.EventAttendee.findAll({
        where: { id_event: eid },
        include: [includes.defaultUserIncludeSQ]
    }));
};

exports.getEventAttendees = function(req, res) {
    return exports.sendEventAttendees(parseInt(req.params.eid), res);
};

exports.addEventAttendees = function(req, res) {
    let eid = parseInt(req.params.eid);
    let users = req.body.users.map(u => { return { id_user: u, id_event: eid }});
    return db.EventAttendee.bulkCreate(users, { ignoreDuplicates: true })
        .then(() => {
            return exports.sendEventAttendees(eid, res);
        })
        .catch(err => {
            return util.errorResponse(res);
        });
};

exports.deleteEventAttendees = function(req, res) {
    let eid = parseInt(req.params.eid);
    return util.handleDeletion(res, db.EventAttendee.destroy({
        where: {
            id_event: eid,
            id_user: req.body.users
        }
    }));
};

exports.subscribeToEvent = function(req, res) {
    const eid = parseInt(req.params.eid);
    return db.EventAttendee.create({
        id_user: userutil.getCurrUserId(req),
        id_event: eid
    }, { ignoreDuplicates: true }).then(() => {
        return util.successResponse(res, util.successObj);
    }).catch(err => {
        return util.errorResponse(res);
    });
};

exports.getCurrentUserEvents = function(req, res) {
    return util.sendModelOrError(res, db.EventAttendee.findAll({
        where: {id_user: userutil.getCurrUserId(req)},
        include: [includes.defaultEventIncludeSQ]
    }), events => { return events.map(e => e.event); });
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