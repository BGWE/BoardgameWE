const db = require("./models/index");
const util = require("./util/util");
const userutil = require("./util/user");
const moment = require("moment");

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