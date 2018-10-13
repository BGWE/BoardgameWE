const db = require("./models/index");
const util = require("./util/util");
const userutil = require("./util/user");
const moment = require("moment");

exports.userIncludeSQ = {
    model: db.User, as: "user", attributes: {exclude: ["password"]}
};

exports.boardGameIncludeSQ = {model: db.BoardGame, as: "board_game"};

exports.createEvent = function(req, res) {
    // validate date
    let start = moment.utc(req.body.start, moment.ISO_8601);
    let end = moment.utc(req.body.end, moment.ISO_8601);
    if (!(start.isValid() && end.isValid() && start.isBefore(end)) && req.body.name && req.body.name.length > 0) {
        return res.status(403).send({error: "invalid dates or name"})
    }
    return util.sendModelOrError(db.Event.build({
        name: req.body.name,
        location: req.body.location,
        start: start.toDate(),
        end: end.toDate(),
        id_creator: userutil.getCurrUserId(req),
        description: req.body.description
    }).save(), res, "event");
};

exports.getEvent = function(req, res) {
    return util.sendModelOrError(db.Event.findById(parseInt(req.params.eid)), res, "event");
};

exports.getFullEvent = function(req, res) {
    db.Event.findById(parseInt(req.params.eid))
        .then(event => {
            db.ProvidedBoardGame.findAll({
                where: {id_event: event.id}, include: [exports.userIncludeSQ, exports.boardGameIncludeSQ]
            }).then(board_games => {
                res.status(200).json(Object.assign({board_games: board_games}, event.dataValues));
            })
        });
};

exports.getAllEvents = function(req, res) {
    return util.sendModelOrError(db.Event.findAll(), res, "events");
};

exports.deleteEvent = function(req, res) {
    let eid = parseInt(req.params.eid);
    return db.Event.destroy({where: {
        id: eid,
        id_creator: userutil.getCurrUserId(req)  // restrict suppression of events to the creator
    }}).then(
        n => { return util.sendModelOrError(db.Event.findAll(), res, "events"); }
    ).catch(
        err => { return res.status(500).send({error: "err"}); }
    );
};

exports.sendProvidedBoardGames = function(eid, res) {
    return db.ProvidedBoardGame.findAll(
        { where: { id_event: eid }, include: [exports.userIncludeSQ, exports.boardGameIncludeSQ]
    }).then(provided => {
        res.status(200).send(provided);
    }).catch(err => {
        res.status(500).send({error: "err"});
    });
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
            res.status(500).send({error: "err"});
        });
};

exports.getProvidedBoardGames = function(req, res) {
    let eid = parseInt(req.params.eid);
    return exports.sendProvidedBoardGames(eid, res);
};

exports.deleteProvidedBoardGames = function(req, res) {
    let eid = parseInt(req.params.eid);
    return db.ProvidedBoardGame.destroy({
        where: {
            id_event: eid,
            id_user: userutil.getCurrUserId(req),
            id_board_game: req.body.board_games
        }
    }).then(() => {
        return exports.sendProvidedBoardGames(eid, res);
    }).catch(err => {
        res.status(500).send({error: "err"});
    });
};

exports.sendEventAttendees = function(eid, res) {
    return db.EventAttendee.findAll({where: { id_event: eid }, include: [exports.userIncludeSQ] })
        .then(provided => {
            res.status(200).send(provided);
        }).catch(err => {
            res.status(500).send({error: "err"});
        });
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
            res.status(500).send({error: "err"});
        });
};

// exports.deleteParticipants = function(req, res) {
//
// };