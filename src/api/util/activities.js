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
        return Object.assign(activity, {event: data.dataValues.event});
    } else if (type === exports.ACTIVITY_USER_GAME_PLAY) {
        return Object.assign(activity, {board_game: data.game.dataValues.board_game});
    } else if (type === exports.ACTIVITY_USER_LIBRARY_ADD) {
        return Object.assign(activity, {board_game: data.dataValues.board_game});
    } else if (type === exports.ACTIVITY_EVENT_USER_JOIN) {
        return Object.assign(activity, {user: data.dataValues.user});
    } else if (type === exports.ACTIVITY_EVENT_GAME_PROVIDED) {
        return Object.assign(activity, {
            board_game: data.dataValues.provided_board_game,
            user: data.dataValues.provider
        });
    } else if (type === exports.ACTIVITY_EVENT_GAME_PLAY) {
        const GameController = require("../GameController");
        return Object.assign(activity, {game: GameController.formatGameRanks(data)});
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
        return db.GamePlayer.findAll({
            where: {id_user: id_user},
            attributes: [["createdAt", "datetime"], "id_game"],
            include: [
                includes.genericIncludeSQ(db.Game, 'game', [
                includes.genericIncludeSQ(db.BoardGame, 'board_game')
            ])],
            order: [[db.sequelize.col("datetime"), "DESC"]], limit: max
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
