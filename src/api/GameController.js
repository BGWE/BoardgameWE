const db = require("./models/index");
const util = require("./util/util");
const includes = require("./util/db_include");
const m2m = require("./util/m2m_helpers");
const userutil = require("./util/user");

exports.gameFullIncludesSQ = [
    includes.defaultBoardGameIncludeSQ,
    includes.genericIncludeSQ(db.GamePlayer, "game_players", [includes.getShallowUserIncludeSQ("user")]),
    includes.genericIncludeSQ(db.PlayedExpansion, "expansions", [includes.getBoardGameIncludeSQ("board_game")])
];

exports.formatGameRanks = function(game) {
    game.dataValues.players = exports.rankForGame(game);
    game.dataValues.game_players = undefined; // to keep the more intuitive "players" label in json
    return game;
};

exports.formatPlayedExpansions = function(game) {
    game.dataValues.expansions = game.dataValues.expansions.map(bg => bg.board_game);
    return game;
};

exports.buildFullGame = (gameId, res) => {
    return util.sendModel(res, db.Game.findOne({
        where: {id: gameId},
        include: exports.gameFullIncludesSQ
    }), g => exports.formatPlayedExpansions(exports.formatGameRanks(g)));
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
            id_event: eid || null,
            id_board_game: req.body.id_board_game,
            started_at: req.body.started_at.utc(),
            duration: req.body.duration || null,
            ranking_method: req.body.ranking_method,
            id_timer: req.body.id_timer || null,
            comment: req.body.comment || "",
        }, {transaction: t}).then((game) => {
            const player_data = getGamePlayerData(game, req.body.players);
            return Promise.all([
              db.GamePlayer.bulkCreate(player_data, { returning: true, transaction: t}),
              m2m.addAssociations({
                model_class: db.PlayedExpansion,
                fixed: {id: game.id, field: "id_game"},
                other: {ids: req.body.expansions, field: "id_board_game"},
                options: {transaction: t}
              })
            ]).then(() => {
                return game;
            });
        });
    }).then(game => {
        return exports.buildFullGame(game.id, res);
    });
};

exports.addGame = function (req, res) {
    return exports.addGameQuery(req.body.id_event, req, res);
};

exports.updateGameQuery = function(gid, req, res) {
  return db.sequelize.transaction(async t => {
    let game = await db.Game.findByPk(gid, {transaction: t, lock: t.LOCK.UPDATE});
    if (!game) {
      return util.detailErrorResponse(res, 404, "game not found");
    }
    if (req.body.ranking_method && req.body.ranking_method !== game.ranking_method && !req.body.players) {
      return util.detailErrorResponse(res, 400, "'players' list should be provided when 'ranking_method' changes");
    }

    // access checks prevent game to be switched from an event to another
    await db.Game.update({
      id_event: req.body.id_event === null ? null : req.body.id_event || game.id_event,
      started_at: req.body.started_at ? req.body.started_at.utc() : game.started_at,
      id_board_game: req.body.id_board_game || game.id_board_game,
      duration: req.body.duration || game.duration,
      ranking_method: req.body.ranking_method || game.ranking_method,
      comment: req.body.comment || game.comment
    }, {
      where: { id: game.id },
      transaction: t, lock: t.LOCK.UPDATE
    });

    if (req.body.players) {
      await db.GamePlayer.destroy({transaction: t, where: {id_game: game.id}});
      const playersData = getGamePlayerData(game, req.body.players);
      await db.GamePlayer.bulkCreate(playersData, {transaction: t});
    }

    if (req.body.expansions) {
      await Promise.all(m2m.diffAssociations({
        model_class: db.PlayedExpansion,
        fixed: {field: "id_game", id: game.id},
        other: {field: "id_board_game", ids: req.body.expansions},
        options: {transaction: t}
      }));
    }

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
        (player) => player.score,
        game.ranking_method === db.Game.RANKING_NO_POINT || game.ranking_method === db.Game.RANKING_LOWER_BETTER,
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
        return games.map(exports.formatPlayedExpansions).map(exports.formatGameRanks);
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

exports.getSuggestedPlayers = function (req, res) {
  const max_players = req.query.max_players || 3;
  const id_user = userutil.getCurrUserId(req);
  let incl = {
    ...includes.genericIncludeSQ(db.Game, "game", exports.gameFullIncludesSQ),
  };
  if (req.query.id_event) { // filter events if necessary
    incl = { where: { id_event: req.query.id_event }, ...incl };
  }
  return db.GamePlayer.findAll({
    where: { id_user },
    include: {
      required: true,
      ...incl
    },
    order: [
      [{
        model: db.Game,
        as: "game"
      }, "started_at", "DESC"]
    ],
  }).then(played => {
    let games = played.map(p => p.game);
    // currently: sends players that were part of current player's last game
    let players = [];
    if (games.length > 0) {
      players = games[0].game_players.filter(p => (p.id_user !== id_user) && p.user).map(p => p.user).slice(0, max_players)
    }
    return util.successResponse(res, players);
  });
};