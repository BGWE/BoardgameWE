const includes = require("./db_include");
const db = require("../models/index");
const moment = require("moment");

exports.ACTIVITY_USER_EVENT_JOIN = "user/join_event";
exports.ACTIVITY_USER_LIBRARY_ADD = "user/library_add";
exports.ACTIVITY_USER_GAME_PLAY = "user/play_game";
exports.ACTIVITY_EVENT_USER_JOIN = "event/user_join";
exports.ACTIVITY_EVENT_GAME_PLAY = "event/play_game";
exports.ACTIVITY_EVENT_GAME_PROVIDED = "event/add_game";
exports.ALL_USER_ACTIVITIES = [exports.ACTIVITY_USER_EVENT_JOIN, exports.ACTIVITY_USER_LIBRARY_ADD, exports.ACTIVITY_USER_GAME_PLAY];
exports.ALL_EVENT_ACTIVITIES = [exports.ACTIVITY_EVENT_USER_JOIN, exports.ACTIVITY_EVENT_GAME_PLAY, exports.ACTIVITY_EVENT_GAME_PROVIDED];

exports.makeActivities = (type, data) => {
    return data.map(d => exports.makeActivity(type, d));
};

exports.makeActivity = (type, data) => {
    let activity = {datetime: data.dataValues.datetime, type: type};
    if (type === exports.ACTIVITY_USER_EVENT_JOIN) {
        return { event: data.dataValues.event, ... activity };
    } else if (type === exports.ACTIVITY_USER_GAME_PLAY) {
        const GameController = require("../GameController");
        let final = { game: GameController.formatGameRanks(data), ... activity };
        final.game.dataValues.datetime = undefined; // remove datetime field from game object
        return final;
    } else if (type === exports.ACTIVITY_USER_LIBRARY_ADD) {
        return { board_game: data.dataValues.board_game, ... activity };
    } else if (type === exports.ACTIVITY_EVENT_USER_JOIN) {
        return { user: data.dataValues.user, ... activity };
    } else if (type === exports.ACTIVITY_EVENT_GAME_PROVIDED) {
        return {
          board_game: data.dataValues.provided_board_game,
          user: data.dataValues.provider,
          ...activity
        };
    } else if (type === exports.ACTIVITY_EVENT_GAME_PLAY) {
        const GameController = require("../GameController");
        return { game: GameController.formatGameRanks(data), ... activity };
    } else {
        throw new Error("unknown activity type '" + type + "'");
    }
};

exports.getEventActivitiesRequestPromise = (type, id_event, max) => {
    max = max || 10;
    if (type === exports.ACTIVITY_EVENT_USER_JOIN) {
        return db.EventAttendee.findAll({
            where: { id_event: id_event },
            attributes: [["createdAt", "datetime"], "id_user"],
            include: [includes.defaultUserIncludeSQ],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: max
        });
    } else if (type === exports.ACTIVITY_EVENT_GAME_PLAY) {
        const GameController = require("../GameController");
        return db.Game.findAll({
            where: { id_event: id_event },
            attributes: { include: [["createdAt", "datetime"]] },
            include: GameController.gameFullIncludesSQ,
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: max
        });
    } else if (type === exports.ACTIVITY_EVENT_GAME_PROVIDED) {
        return db.ProvidedBoardGame.findAll({
            where: {id_event: id_event},
            attributes: [["createdAt", "datetime"], "id_board_game", "id_user"],
            include: [
                includes.getBoardGameIncludeSQ("provided_board_game"),
                includes.getUserIncludeSQ("provider")
            ],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: max
        });
    } else {
        throw new Error("unknown activity type '" + type + "'")
    }
};

exports.getUserActivitiesRequestPromise = (type, id_user, max) => {
    max = max || 10;
    if (type === exports.ACTIVITY_USER_EVENT_JOIN) {
        return db.EventAttendee.findAll({
            where: {id_user: id_user},
            attributes: [["createdAt", "datetime"], "id_event"],
            include: [includes.defaultEventIncludeSQ],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: max
        });
    } else if (type === exports.ACTIVITY_USER_GAME_PLAY) {
        const GameController = require("../GameController");
        const select_games = db.selectFieldQuery("GamePlayers", "id_game", {id_user});
        return db.Game.findAll({
          where: { id: {[db.Op.in]: db.sequelize.literal('(' + select_games + ')')} },
          include: GameController.gameFullIncludesSQ,
          attributes: {include: [["createdAt", "datetime"]]},
          order: [["createdAt", "DESC"]],
          limit: max
        });
    } else if (type === exports.ACTIVITY_USER_LIBRARY_ADD) {
        return db.LibraryGame.findAll({
            where: {id_user: id_user},
            attributes: [["createdAt", "datetime"], "id_board_game"],
            include: [includes.defaultBoardGameIncludeSQ],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: max
        });
    } else {
        throw new Error("unknown activity type '" + type + "'")
    }
};

exports.getUserActivitiesPromise = (id_user, max) => {
    max = max || 10; // max number of activities to return
    return Promise.all(exports.ALL_USER_ACTIVITIES.map(type => {
        return exports.getUserActivitiesRequestPromise(type, id_user, max)
            .then(d => exports.makeActivities(type, d));
    })).then(activities => {
        let all = activities.reduce((a, i) => i.concat(a), []);
        return all.sort((activity1, activity2) => - moment(activity1.datetime).diff(activity2.datetime)).slice(0, max);
    });
};

exports.getEventActivitiesPromise = (id_event, max) => {
    max = max || 10; // max number of activities to return
    return Promise.all(exports.ALL_EVENT_ACTIVITIES.map(type => {
        return exports.getEventActivitiesRequestPromise(type, id_event, max)
            .then(d => exports.makeActivities(type, d));
    })).then(activities => {
        let all = activities.reduce((a, i) => i.concat(a), []);
        return all.sort((activity1, activity2) => - moment(activity1.datetime).diff(activity2.datetime)).slice(0, max);
    });
};
