const db = require("./models/index");
const userutil = require("./util/user");
const util = require("./util/util");
const game = require("./GameController");
const includes = require("./util/db_include");


exports.expectedTypes = ["COUNT_UP", "COUNT_DOWN", "RELOAD"];

exports.fullTimerIncludes = [
    includes.defaultGameIncludeSQ,
    includes.genericIncludeSQ(db.PlayerGameTimer, "player_timers", [includes.defaultUserIncludeSQ])
];

exports.isTimerDataValid = function(data) {
    const typeSet = new Set(exports.expectedTypes);
    return (data.timer_type === undefined || typeSet.has(data.timer_type))
                && (data.initial_duration === undefined || data.initial_duration >= 0)
                && (data.timer_type !== "RELOAD" || (data.reload_increment === undefined || data.reload_increment >= 0));
};

/**
 * Return a promise that creates a full game object
 * @param data
 */
exports.buildFullTimer = function(tid) {
    return db.GameTimer.find({
        where: {id: tid},
        include: exports.fullTimerIncludes
    });
};

/**
 * Create a default data object
 * @param id_user int|null
 * @param name string|null
 * @returns {{id_user: *, name: *, color: string, elapsed: number, start: null}}
 */
exports.getDefaultPlayerTimer = function(id_user, name) {
    return {
        id_user: id_user,
        name: name,
        color: "#ffffff",
        elapsed: 0,
        start: null
    }
};

/**
 * Create a new timer (and related data) in the database
 * @param timer_data Object timer data
 * @param timer_data.id_game
 * @param timer_data.id_creator
 * @param timer_data.initial_duration
 * @param individual_timers Object[]
 * @param individual_timers.color string
 * @param individual_timers.name string|null
 * @param individual_timers.id_user int|null
 * @param per_type_data Object additional data needed for specific timer type (such as duration_increment for RELOAD)
 * @param per_type_data.duration_increment ('RELOAD' timer type only) reload time increment
 * @returns {*|PromiseLike<int>|Promise<int>} Timer id on success.
  */
exports.createTimerPromise = function(timer_data, individual_timers, per_type_data) {
    return db.sequelize.transaction(t => {
        return db.GameTimer.create(timer_data, {transaction: t})
            .then((timer) => {
                const timers = individual_timers.map(t => {
                    t.id_timer = timer.id;
                    return t;
                });

                let promise = db.PlayerGameTimer.bulkCreate(timers, {transaction: t});

                if (timer_data.timer_type === "RELOAD") {
                    promise = promise.then(() => db.ReloadGameTimer.create({
                        id: timer.id,
                        timer_type: "RELOAD",
                        duration_increment: per_type_data.duration_increment
                    }, {transaction: t}));
                }

                return promise.then(() => new Promise((resolve, reject) => resolve(timer.id)));  // to return timer id
            });
    });
};

exports.addTimerFromGame = function(req, res) {
    const gid = parseInt(req.params.gid);
    if (!exports.isTimerDataValid(req.body)) {
        return util.detailErrorResponse(res, 400, "invalid timer data");
    }

    const timer_data = {
        id_creator: userutil.getCurrUserId(req),
        id_game: gid,
        timer_type: req.body.timer_type || "COUNT_UP",
        initial_duration: req.body.initial_duration || 0
    };
    const per_type_data = {
        duration_increment: req.body.reload_increment || 0
    };

    return db.Game.find({
        where: {id: gid},
        include: [includes.genericIncludeSQ(db.GamePlayer, "game_players", [includes.defaultUserIncludeSQ])]
    }).then(game => {
        const timers = game.game_players.map(p => exports.getDefaultPlayerTimer(p.id_user, p.name));
        return exports.createTimerPromise(timer_data, timers, per_type_data).then(id_timer => {
            return util.sendModelOrError(res, exports.buildFullTimer(id_timer));
        }).catch(err => {
            return util.detailErrorResponse(res, 500, "cannot create timer");
        });
    }).catch(err => {
        return util.detailErrorResponse(res, 404, "game id:" + gid + " not found.");
    })
};

exports.getTimer = function(req, res) {
    const tid = parseInt(req.params.tid);
    return util.sendModelOrError(res, exports.buildFullTimer(tid))
};

exports.createTimer = function(req, res) {

};