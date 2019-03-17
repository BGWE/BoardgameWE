const includes = require("./db_include");
const db = require("../models/index");
const moment = require("moment");

exports.ACTIVITY_EVENT_JOIN = "event/join";
exports.ACTIVITY_LIBRARY_ADD = "library/add";
exports.ACTIVITY_GAME_PLAY = "game/play";
exports.ALL_ACTIVITIES = [exports.ACTIVITY_EVENT_JOIN, exports.ACTIVITY_LIBRARY_ADD, exports.ACTIVITY_GAME_PLAY];

exports.makeActivities = (type, data) => {
    return data.map(d => exports.makeActivity(type, d));
};

exports.makeActivity = (type, data) => {
    let activity = {datetime: data.dataValues.datetime, type: type};
    if (type === exports.ACTIVITY_EVENT_JOIN) {
        return Object.assign(activity, {event: data.dataValues.event});
    } else if (type === exports.ACTIVITY_GAME_PLAY) {
        return Object.assign(activity, {board_game: data.game.dataValues.board_game});
    } else if (type === exports.ACTIVITY_LIBRARY_ADD) {
        return Object.assign(activity, {board_game: data.dataValues.board_game});
    } else {
        throw new Error("unknown activity type '" + type + "'");
    }
};

exports.getActivitiesRequestPromise = (type, id_user) => {
    if (type === exports.ACTIVITY_EVENT_JOIN) {
        return db.EventAttendee.findAll({
            where: {id_user: id_user},
            attributes: [["createdAt", "datetime"], "id_event"],
            include: [includes.defaultEventIncludeSQ],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: 10
        });
    } else if (type === exports.ACTIVITY_GAME_PLAY) {
        return db.GamePlayer.findAll({
            where: {id_user: id_user},
            attributes: [["createdAt", "datetime"], "id_game"],
            include: [includes.genericIncludeSQ(db.Game, 'game', [
                includes.genericIncludeSQ(db.BoardGame, 'board_game')
            ])],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: 10
        });
    } else if (type === exports.ACTIVITY_LIBRARY_ADD) {
        return db.LibraryGame.findAll({
            where: {id_user: id_user},
            attributes: [["createdAt", "datetime"], "id_board_game"],
            include: [includes.defaultBoardGameIncludeSQ],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: 10
        });
    } else {
        throw new Error("unknown activity type '" + type + "'")
    }
};

exports.getUserActivitiesPromise = (id_user, max) => {
    max = max || 10; // max number of activities to return
    return Promise.all(exports.ALL_ACTIVITIES.map(type => {
        return exports.getActivitiesRequestPromise(type, id_user)
            .then(d => exports.makeActivities(type, d));
    })).then(activities => {
        let all = activities.reduce((a, i) => i.concat(a), []);
        return all.sort((activity1, activity2) => - moment(activity1.datetime).diff(activity2.datetime)).slice(0, max);
    });


};
