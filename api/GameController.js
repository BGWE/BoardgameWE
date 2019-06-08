const db = require("./models/index");
const util = require("./util/util");
const includes = require("./util/db_include");
const { validationResult } = require('express-validator/check');

exports.gameFullIncludesSQ = [
    includes.defaultBoardGameIncludeSQ,
    includes.genericIncludeSQ(db.GamePlayer, "game_players", [includes.defaultUserIncludeSQ])
];

/**
 * Validate ranks from the list
 */
exports.validateRanks = (ranking_method, ranks) => {
    if (ranking_method === "WIN_LOSE") {
        for (let i = 0; i < ranks.length; ++i) {
            if (ranks[i] !== 0 && ranks[i] !== 1) {
                return {valid: false, error: "Invalid rank '" + ranks[i] + "'"};
            }
        }
    } else if (ranking_method !== "POINTS_LOWER_BETTER"
        && ranking_method !== "POINTS_HIGHER_BETTER") {
        return {valid: false, error: "Invalid ranking method '" + ranking_method + "'"};
    }
    return {valid: true};
};

/**
 * Check whether players are correct
 */
exports.validateGamePlayers = (players) => {
    for (let i = 0; i < players.length; ++i) {
        if (!(players[i].hasOwnProperty("user") && players[i].user > 0)  // TODO validate user ids by checking in db
                && !(players[i].hasOwnProperty("name") && players[i].name.length > 0)) {
            return {valid: false, error: "Invalid player. Missing or invalid fields 'name' or 'user'."};
        }
    }
    return {valid: true};
};

exports.fromGamePlayersToRanks = function(game) {
    game.dataValues.players = exports.rankForGame(game);
    game.dataValues.game_players = undefined; // to keep the more intuitive "players" label in json
    return game;
};

exports.buildFullGame = (gameId, res) => {
    return util.sendModelOrError(res, db.Game.findOne({
        where: {id: gameId},
        include: exports.gameFullIncludesSQ
    }), g => exports.fromGamePlayersToRanks(g));
};

const preprocessGameData = function(body) {
    let data = {
        players: body.players,
        id_board_game: body.id_board_game,
        ranking_method: body.ranking_method,
        duration: body.duration || null,
        has_players: body.players !== undefined && body.players.length > 0
    };

    if (data.has_players) {
        data.ranking_validation = exports.validateRanks(
            body.ranking_method,
            body.players.map((item) => { return item.score; })
        );
        data.players_validation = exports.validateGamePlayers(body.players);
    }

    return data;
};

const getGamePlayerData = function(game, validated_players) {
    return validated_players.map((item) => {
        return {
            id_game: game.id,
            score: item.score,
            id_user: item.id_user || null,
            name: item.name || null
        };
    });
};

/**
 * Execute the addition of a game
 * @param eid Event id or null.
 * @param req
 * @param res
 * @returns {*}
 */
exports.addGameQuery = function(eid, req, res) {
    return db.sequelize.transaction(t => {
        return db.Game.create({
            id_event: eid,
            id_board_game: req.body.id_board_game,
            duration: req.body.duration || null,
            ranking_method: req.body.ranking_method,
            id_timer: req.body.id_timer || null,
        }, {transaction: t}).then((game) => {
            const player_data = getGamePlayerData(game, req.body.players);
            return db.GamePlayer.bulkCreate(player_data, {
                returning: true,
                transaction: t
            }).then(players => {
                return game;
            });
        })
    }).then(game => {
        return exports.buildFullGame(game.id, res);
    }).catch(err => {
        return util.errorResponse(res);
    });
};

exports.addGame = function (req, res) {
    return exports.addGameQuery(req.body.id_event || null, req, res);
};

exports.addEventGame = function(req, res) {
    return exports.addGameQuery(req.params.eid, req, res);
};

exports.updateEventGame = function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return util.detailErrorResponse(res, 400, "cannot update event", errors);
    }
    return db.sequelize.transaction(t => {
        return db.Game.findByPk(req.params.gid, {transaction: t})
            .then(game => {
                if (req.body.ranking_method !== game.ranking_method && !req.body.players) {
                    return util.detailErrorResponse(res, 400, "'players' list should be provided when 'ranking_method' changes");
                }
                return db.Game.update({
                    id_board_game: req.body.id_board_game || game.id_board_game,
                    duration: req.body.duration || game.duration,
                    ranking_method: req.body.ranking_method || game.ranking_method,
                    id_event: req.body.id_event || req.params.eid
                }, {
                    where: {id: game.id, id_event: req.params.eid},
                    transaction: t
                }).then(updated => {
                    if (req.body.players) {
                        return db.GamePlayer.destroy({
                            transaction: t,
                            where: {id_game: game.id}
                        }).then(deleted => {
                            const playersData = getGamePlayerData(game, req.body.players);
                            return db.GamePlayer.bulkCreate(playersData, {
                                transaction: t
                            }).then(players => { return game; });
                        });
                    } else {
                        return game;
                    }
                });
            });
    }).then(game => {
        return exports.buildFullGame(game.id, res);
    }).catch(err => {
        console.error(err);
        return util.errorResponse(res);
    });
};

exports.rankForGame = function(game) {
    return util.rank(game.game_players, (player) => player.score, game.ranking_method === "POINTS_LOWER_BETTER");
};

exports.sendAllGamesFiltered = function (filtering, res, options) {
    if (!options) {
        options = {};
    }
    return util.sendModelOrError(res, db.Game.findAll(Object.assign(options, {
        where: filtering,
        include: exports.gameFullIncludesSQ
    })), games => {
        return games.map(g => exports.fromGamePlayersToRanks(g));
    });
};

exports.getGames = function (req, res) {
    // no filtering
    return exports.sendAllGamesFiltered(undefined, res);
};

exports.getGame = function (req, res) {
    return exports.buildFullGame(parseInt(req.params.gid), res);
};

exports.deleteGame = function (req, res) {
    const gid = parseInt(req.params.gid);
    return util.handleDeletion(res, db.sequelize.transaction(res, (t) => {
        return db.GamePlayer.destroy({
            where: {id_game: gid}
        }).then(() => {
            return db.Game.destroy({where: {id: gid}}, {transaction: t});
        });
    }));
};

exports.getEventGames = function(req, res) {
    return exports.sendAllGamesFiltered(
        { id_event: parseInt(req.params.eid) }, res,
        util.getPaginationParams(req, [["createdAt", "DESC"]])
    );
};

exports.getRecentEventGames = function(req, res) {
    return exports.sendAllGamesFiltered({
        id_event: parseInt(req.params.eid)
    }, res, {
        order: [["createdAt", "DESC"]],
        limit: req.query.count || 10
    });
};