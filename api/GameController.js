const db = require("./models/index");
const util = require("./util/util");
const includes = require("./util/db_include");
const userutil = require("./util/user");

exports.gameFullIncludesSQ = [
    includes.defaultBoardGameIncludeSQ,
    includes.genericIncludeSQ(db.GamePlayer, "game_players", [includes.getShallowUserIncludeSQ("user")])
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
    return util.sendModel(res, db.Game.findOne({
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
    });
};

exports.addGame = function (req, res) {
    return exports.addGameQuery(req.params.eid, req, res);
};

exports.updateGameQuery = function(gid, req, res) {
  return db.sequelize.transaction(async t => {
    let game = await db.Game.findByPk(req.params.gid, {transaction: t});
    if (!game) {
      return util.detailErrorResponse(res, 404, "game not found");
    }
    if (req.body.ranking_method !== game.ranking_method && !req.body.players) {
      return util.detailErrorResponse(res, 400, "'players' list should be provided when 'ranking_method' changes");
    }

    // For security: cannot change event id of an existing event (could break event access policies)
    game = await game.update({
      id_board_game: req.body.id_board_game || game.id_board_game,
      duration: req.body.duration || game.duration,
      ranking_method: req.body.ranking_method || game.ranking_method
    }, {
      where: { id: game.id },
      transaction: t, lock: t.LOCK.UPDATE
    });

    if (!req.body.players) {
      return game;
    }

    // delete old players
    await db.GamePlayer.destroy({ transaction: t, where: {id_game: game.id} });
    const playersData = getGamePlayerData(game, req.body.players);
    await db.GamePlayer.bulkCreate(playersData, { transaction: t });
    return game;
  }).then(game => {
    return exports.buildFullGame(game.id, res);
  });
};

exports.updateGame = function(req, res) {
  return exports.updateGameQuery(req.params.gid, req, res);
};

exports.rankForGame = function(game) {
    return util.rank(
        game.game_players,
        (player) => player.score, game.ranking_method === "POINTS_LOWER_BETTER",
        (o, f, v) => { o.dataValues[f] = v; }  // write in dataValues not to lose values on the way
    );
};

exports.sendAllGamesFiltered = function (filtering, res, options) {
    if (!options) {
        options = {};
    }
    return util.sendModel(res, db.Game.findAll(Object.assign(options, {
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

exports.getUserGames = function(req, res) {
    const uid = parseInt(req.params.uid);
    const player_query = db.selectFieldQuery("GamePlayers", "id_game", {id_user: uid});
    return exports.sendAllGamesFiltered({id: {[db.Op.in]: db.sequelize.literal('(' + player_query + ')')}}, res);
};

exports.getGame = function (req, res) {
    return exports.buildFullGame(parseInt(req.params.gid), res);
};

exports.deleteGame = function (req, res) {
    const gid = parseInt(req.params.gid);
    return db.sequelize.transaction(res, (t) => {
        return db.GamePlayer.destroy({
            where: {id_game: gid}
        }).then(() => {
            return db.Game.destroy({where: {id: gid}}, {transaction: t});
        });
    }).then(() => {
      return util.successResponse(res, exports.successObj);
    });
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