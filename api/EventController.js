const db = require("./models/index");
const util = require("./util/util");
const userutil = require("./util/user");
const moment = require("moment");

const userInclude = {
    model: db.User, as: "user", attributes: {exclude: ["password"]}
};

const boardGameInclude = {
    model: db.BoardGame, as: "board_game"
};

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
            db.ProvidedBoardGame.findAll({ where: {id_event: event.id}, include: [userInclude, boardGameInclude]}).then(board_games => {
                res.status(200).json(Object.assign({board_games: board_games}, event.dataValues));
            })
        });
};

exports.getAllEvents = function(req, res) {
    return util.sendModelOrError(db.Event.findAll(), res, "events");
};

exports.deleteEvent = function(req, res) {
    let eid = parseInt(req.params.eid);
    return db.Event.destroy({ where: {id: eid}}).then(
        n => { return util.sendModelOrError(db.Event.findAll(), res, "events"); }
    ).catch(
        err => { return res.status(500).send({error: "err"}); }
    );
};

exports.sendCurrEventGames = function(req, res) {

};

exports.addProvidedBoardGames = function(req, res) {
    let eid = parseInt(req.params.eid);
    let userId = userutil.getCurrUserId(req);
    let board_games = req.body.board_games.map(g => { return { id_user: userId, id_board_game: g, id_event: eid }});
    db.ProvidedBoardGame.bulkCreate(board_games, { ignoreDuplicates: true })
        .then(() => {
            return db.ProvidedBoardGame.findAll({ where: { id_event: eid }, include: [userInclude, boardGameInclude] })
                .then(provided => {
                    res.status(200).send(provided);
                })
                .catch(err => {
                    res.status(500).send({error: "err"});
                });
        })
        .catch(err => {
            res.status(500).send({error: "err"});
        });
};



// exports.getParticipants = function(req, res) {
//
// };
//
// exports.addParticipants = function(req, res) {
//
// };
//
// exports.deleteParticipants = function(req, res) {
//
// };