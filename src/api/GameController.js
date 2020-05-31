const db = require("./models/index");
const util = require("./util/util");
const includes = require("./util/db_include");
const m2m = require("./util/m2m_helpers");
const userutil = require("./util/user");
const lodash = require("lodash");
const moment = require("moment");

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


exports.formatFetchedGames = (games) => {
  return games.map(exports.formatPlayedExpansions).map(exports.formatGameRanks);
};

/**
 * Return all game object formatted with expansions and ranks.
 * @param req Request object
 * @param res Response object
 * @param filtering An object that can be used as a sequelize where clause. If options is provided, filtering
 * is appended to its where clause, or added as where clause if there is none
 * @param options (optional) The findAll query options objects.
 * @returns {*}
 */
exports.sendAllGamesFiltered = function (req, res, filtering, options) {
  let final_options;
  if (!options) {
    final_options = {
      where: filtering,
      include: exports.gameFullIncludesSQ,
      ... util.getPaginationParams(req, [["started_at", "DESC"]]),
    };
  } else {
    final_options = lodash.clone(options);
    final_options.where = {... options.where, ... filtering};
  }
  return util.sendModel(res, db.Game.findAll(final_options), games => {
    return exports.formatFetchedGames(games);
  });
};

exports.getUserGames = function(req, res) {
  const curr_uid = userutil.getCurrUserId(req);
  const uid = parseInt(req.params.uid);
  // only pick games that were played between current and requested player;
  let where = { id: {[db.Op.in]: db.sequelize.literal('(' + db.selectFieldQuery("GamePlayers", "id_game", { id_user: uid }) + ')')} };
  if (uid === curr_uid) {
    return exports.sendAllGamesFiltered(req, res, where);
  }
  // build query to get events that both users have attended
  const count_attendees_select = db.selectQuery("EventAttendees", {
    attributes: ["id_event", [db.sequelize.fn("count", db.sequelize.col("id_user")), "cnt"]],
    where: { id_user: [curr_uid, uid] },
    group: "id_event"
  });
  const both_attendees_select = "select id_event from (" + count_attendees_select + ") as \"attending\" where cnt >= 2";
  console.log(count_attendees_select);
  console.log(both_attendees_select);
  const public_event_select = db.selectFieldQuery("Events", "id_event", { visibility: db.Event.VISIBILITY_PUBLIC });
  // TODO check if need optimization
  where = db.Sequelize.and(
    where,
    db.Sequelize.or(
      { id_event: null },
      { id_event: {[db.Op.in]: db.sequelize.literal('(' + public_event_select + ')')} },
      { id_event: {[db.Op.in]: db.sequelize.literal('(' + both_attendees_select + ')')} }
    )
  );
  return exports.sendAllGamesFiltered(req, res, where);
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
  return exports.sendAllGamesFiltered(req, res, { id_event: parseInt(req.params.eid) });
};

exports.getRecentEventGames = function(req, res) {
  // disable pagination for this query
  req.query.max_items = req.query.count || 10;
  req.query.start = undefined;
  return exports.sendAllGamesFiltered(req, res, { id_event: parseInt(req.params.eid) });
};

exports.getSuggestedPlayers = async function (req, res) {
  // if not specified infer suggestion type from last game of current user
  // if this game started less than 12 hours ago, use most_recent as a suggestion
  if (!req.query.type) {
    let game = await db.Game.findOne({
      order: [[db.sequelize.col("started_at"), "DESC"]],
      include: [{
        ...includes.genericIncludeSQ(db.GamePlayer, "game_players"),
        where: {id_user: userutil.getCurrUserId(req)}
      }]
    });
    req.query.type = moment(game.started_at).isAfter(moment().subtract(12, 'hours')) ? 'most_recent' : 'most_played';
  }
  switch (req.query.type) {
    case 'most_recent':
      return exports.getSuggestedPlayersMostRecent(req, res);
    case 'most_played':
    default:
      return exports.getSuggestedPlayersMostPlayed(req, res);
  }
};

exports.getSuggestedPlayersMostRecent = function(req, res) {
  const max_players = req.query.max_players || 3;
  const excluded_players = req.query.excluded_players || [];
  const id_user = userutil.getCurrUserId(req);
  let include = {
    required: true,
    model: db.Game,
    as: "game",
    include: [{
      required: true,
      model: db.GamePlayer,
      as: "game_players",
      // existing user but not the current
      where: db.sequelize.and(
        {name: null},
        {id_user: {[db.Op.ne]: id_user}},
        {id_user: {[db.Op.notIn]: excluded_players}}
      ),
      include: [includes.getShallowUserIncludeSQ("user")]
    }]
  };
  if (req.query.id_event) { // filter events if necessary
    include = { where: { id_event: req.query.id_event }, ... include };
  }
  return db.GamePlayer.findAll({
    where: { id_user },
    include: { required: true, ... include },
    // sort to have most recent game as first entry
    order: [[{ model: db.Game, as: "game" }, "started_at", "DESC"]],
  }).then(played => {
    let games = played.map(p => p.game);
    let players = [];
    for (let curr = 0; curr < games.length && players.length < max_players; ++curr) {
      const added_players = new Set(players.map(u => u.id));
      const new_player_batch = games[curr].game_players
          .filter(p => !added_players.has(p.id_user))
          .map(p => p.user)
          .slice(0, max_players - players.length);
      players = players.concat(new_player_batch);
    }
    return util.successResponse(res, players);
  });
};

exports.getSuggestedPlayersMostPlayed = function(req, res) {
  const curr_uid = userutil.getCurrUserId(req);
  const excluded_players = req.query.excluded_players || [];
  const select_user_games = db.selectFieldQuery("GamePlayers", "id_game", { id_user: curr_uid });
  let where_clause = db.sequelize.and(
      {id_user: {[db.Op.ne]: null}},
      {id_user: {[db.Op.ne]: curr_uid}},
      {id_user: {[db.Op.notIn]: excluded_players}},
      {id_game: {[db.Op.in]: db.sequelize.literal('(' + select_user_games + ')')} }
  );
  if (req.query.id_event) {
    const select_event_games = db.selectFieldQuery("Games", "id_game", { id_event: req.query.id_event });
    where_clause = db.sequelize.and(
        where_clause,
        {id_game: {[db.Op.in]: db.sequelize.literal('(' + select_event_games + ')')}}
    );
  }
  return db.GamePlayer.findAll({
    group: [
      "id_user",
      db.sequelize.col('"user"."id"'),
      db.sequelize.col('"user"."name"'),
      db.sequelize.col('"user"."surname"'),
      db.sequelize.col('"user"."username"')
    ],
    attributes: ["id_user", [db.sequelize.fn("count", db.sequelize.col("id_game")), "number_games"]],
    where: where_clause,
    include: [includes.getShallowUserIncludeSQ("user")],
    // sort to have most recent game as first entry
    order: [
      [db.sequelize.literal("number_games"), "DESC"],
    ],
    //raw: true
  }).then(users => {
    const max_players = req.query.max_players || 3;
    let players = users.slice(0, max_players).map(p => p.user);
    return util.successResponse(res, players);
  });
};