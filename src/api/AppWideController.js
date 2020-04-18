const util = require('./util/util');
const db = require("./models/index");

exports.getAppStatistics = function(req, res) {
    return util.sendModel(res, Promise.all([
        db.Game.count(),
        db.User.count(),
        db.LibraryGame.count(),
        db.Event.count()
    ]), function(values) {
        return {
            games_count: values[0],
            users_count: values[1],
            board_games_owned_count: values[2],
            events_count: values[3]
        };
    });
};