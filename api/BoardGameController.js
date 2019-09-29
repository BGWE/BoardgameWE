const db = require("./models/index");
const bgg = require("./util/bgg");
const util = require("./util/util");
const lodash = require("lodash");
const m2m = require("./util/m2m_helpers");
const includes = require("./util/db_include");

exports.boardGameIncludes = [{
  required: false,
  ... includes.genericIncludeSQ(db.BoardGameExpansion, 'expansions', [{
    attributes: ['name', 'thumbnail', 'id'],
    ... includes.genericIncludeSQ(db.BoardGame, 'expansion')
  }])
}];

/**
 * Augment the board_game object with a list containing all expansions of the board game
 * @param board_game_promise {Promise<BoardGame>} The board game to augment
 * @param transaction An optional database transaction
 * @returns {Promise<*>} The augmented board game object
 */
exports.augmentWithExpansions = async (board_game_promise, transaction) => {
  let board_game = await board_game_promise;
  const expansion_data = await exports.getBoardGameExpansionsFromDB(board_game.id, transaction);
  board_game.dataValues.expansions = await db.BoardGame.findAll({ where: {id: {[db.Op.in]: expansion_data.expansions}}, transaction });
  board_game.dataValues.expansion_tree = expansion_data.tree;
  return board_game;
};

exports.getBoardGame = function(req, res) {
  return util.sendModel(res, db.sequelize.transaction(async transaction => {
    return await exports.augmentWithExpansions(
      db.BoardGame.findByPk(parseInt(req.params.bgid), { transaction }),
      transaction
    );
  }));
};

exports.updateBoardGame = function(req, res) {
  const url = req.body.gameplay_video_url;
  if (url == null || url.length === 0) {
      return util.detailErrorResponse(res, 400, "Invalid url");
  }
  const bgid = parseInt(req.params.bgid);
  return db.sequelize.transaction(transaction => {
    return db.BoardGame.update({
      gameplay_video_url: url
    }, {
      where: {id: bgid},
      fields: ["gameplay_video_url"],
      transaction, lock: transaction.LOCK.UPDATE
    }).then(() => {
      return util.sendModel(res, exports.augmentWithExpansions(
        db.BoardGame.findByPk(bgid, { transaction }),
        transaction
      ));
    });
  });
};

const formatGameFromBggResponse = function(response) {
  const checked_array = (arr, index, dflt) => arr && arr.length > 0 ? arr[index] : dflt;
  return {
    name: response.name,
    bgg_id: response.id,
    bgg_score: response.score,
    gameplay_video_url: null,
    min_players: parseInt(response.minplayers),
    max_players: parseInt(response.maxplayers),
    min_playing_time: parseInt(response.maxplaytime),
    max_playing_time: parseInt(response.minplaytime),
    playing_time: parseInt(response.playingtime),
    thumbnail: checked_array(response.thumbnail, 0, null),
    image: checked_array(response.image, 0, null),
    description: checked_array(response.description, 0, null),
    year_published: parseInt(response.yearpublished),
    category: util.listToString(response.boardgamecategory),
    mechanic: util.listToString(response.boardgamemechanic),
    family: util.listToString(response.boardgamefamily)
  };
};

/**
 * Executes an action if a given board game has already been fetched and registered in the database
 * @param gid Id of the game (id from the source)
 * @param source Source where to download game data
 * @param req Input request
 * @param res Response
 * @param actionFn The action to perform, should return a promise,
 * @param transaction A transaction in the context of which this request must be executed
 * @returns {*}
 */
// TODO use validation to check inputs of this request
exports.executeIfBoardGameExists = function(gid, source, req, res, actionFn, transaction) {
  if (source !== "bgg") {
      return util.detailErrorResponse(res, 400, "Invalid source '" + source + "' (only supported are {bgg,}).");
  }

  return exports.addBoardGameAndExpensions(gid, transaction).then(bgid => {
    return db.BoardGame.findByPk(bgid, {transaction, lock: transaction.LOCK.SHARE}).then(board_game => {
      return actionFn(board_game, req, res, transaction);
    });
  });
};

exports.addBoardGame = function(req, res) {
    // load info from board game geek
  return db.sequelize.transaction(transaction => {
    return exports.addBoardGameAndExpensions(req.body.bgg_id, transaction).then(id => {
      return util.sendModelOrError(res, db.BoardGame.findByPk(id, {transaction, include: exports.boardGameIncludes}));
    });
  });
};

exports.getBoardGames = function(req, res) {
    return util.sendModel(res, db.BoardGame.findAll());
};

// TODO use validation to check those fields
exports.searchBoardGames = function(req, res) {
    const searchQuery = req.query.q;
    if (searchQuery == null || searchQuery.length === 0) {
        return util.detailErrorResponse(res, 400, "Invalid search query " + searchQuery + ".");
    }
    return bgg.search(searchQuery).then(body => {
        return util.successResponse(res, bgg.format_search_response(body));
    });
};

exports.deleteBoardGame = function(req, res) {
    const bgid = parseInt(req.params.bgid);
    return db.BoardGame.destroy({ where: {id: bgid} }).then(() => {
        return exports.successResponse(res, exports.successObj);
    });
};

/**
 * Add a board game from bgg. Are also added to the database all board games which are either expansions of this board
 * game, or of which this game is an expansion, or which are expansions of the board game of which this game is an
 * expansion. The database is updated for reflecting the expansion tree.
 * @param bgg_id Board game geek identifier
 * @param transaction The transaction in the context of which to execute the operation
 * @param {boolean} shallow Only go one level deep in both direction of the hierarchy if set to true
 * @returns {Promise<int>} The bgc identifier of the board game
 */
exports.addBoardGameAndExpensions = async function (bgg_id, transaction, shallow=true) {
  let to_fetch = new Set([bgg_id]);
  // stores fetched bgg data and bgc models, maps bgg id with game data
  let bg_cache = {};

  const create_cache_entry = function (cache, id, model, data, parent) { cache[id] = { parent, model, data }; };
  const cache_has_id = (cache, id) => cache[id] !== undefined;
  const logger = require('winston').loggers.get("api");

  // if game was added before expansion support was implemented, we need to check that expansions were already downloaded
  let iter = 0;
  while (to_fetch.size > 0) {
    // fetch data from database and bgg
    to_fetch = Array.from(to_fetch);
    logger.debug("fetching board games from bgg: " + JSON.stringify(to_fetch));
    const raw_bgg_items = await bgg.get(to_fetch);
    const bgg_games = bgg.format_get_response(raw_bgg_items);
    const raw_bgc_games = await db.BoardGame.findAll({
      where: {bgg_id: { [db.Op.in]: to_fetch }}, transaction,
      lock: transaction.LOCK.SHARE
    });
    const bgc_games = lodash.zipObject(raw_bgc_games.map(bg => bg.bgg_id), raw_bgc_games);

    // update cache
    logger.debug("fetched games");
    for (let i = 0; i < bgg_games.length; ++i) {
      const bgg_game = bgg_games[i];
      const id = bgg_game.id;
      logger.debug(`\t${id}\t${bgg_game.name}`);
      create_cache_entry(bg_cache, id, bgc_games[id] ? bgc_games[id] : null, bgg_game);
    }

    // second pass to create next to_fetch list
    to_fetch = new Set();
    for (let i = 0; i < bgg_games.length; ++i) {
      const bgg_game = bgg_games[i];
      bgg_game.expansion_of.filter(i => !cache_has_id(bg_cache, i)).forEach(i => to_fetch.add(i));
      bgg_game.expansions.filter(i => !cache_has_id(bg_cache, i)).forEach(i => to_fetch.add(i));
    }

    if (shallow && iter++ === 1) { break; }
  }

  // all data have been fetched, all cache entries have bgg data
  // save board games unknown to bgc
  const entries_to_insert = lodash.values(bg_cache).filter(e => !e.model);
  const bg_to_insert = entries_to_insert.map(e => formatGameFromBggResponse(e.data));
  await db.BoardGame.bulkCreate(bg_to_insert, {transaction});
  const raw_added_bg = await db.BoardGame.findAll({
    where: { bgg_id: { [db.Op.in]: entries_to_insert.map(e => e.data.id) } },
    transaction
  });
  raw_added_bg.forEach(bg => {
    bg_cache[bg.bgg_id].model = bg;
  });

  // minimize the number of sql requests -> bulk update
  // create entries for the expansions that were missing in the table
  let queries = lodash.values(bg_cache).map(entry => {
    return m2m.addAssociations({
      model_class: db.BoardGameExpansion,
      fixed: { field: 'id_expanded', id: entry.model.id },
      other: {
        field: 'id_expansion',
        ids: entry.data.expansions.filter(id => lodash.has(bg_cache, id)).map(id => bg_cache[id].model.id)
      },
      options: {transaction}
    })
  });

  await Promise.all(lodash.flatten(queries));
  return bg_cache[bgg_id].model.id;
};

/**
 * Get the expansion structure and identifiers for a given board game.
 * @param bgid_root The game at the root of the expansion tree
 * @param transaction A database transaction
 * @returns {Promise<{tree, expansions: any[], root: *}>} `tree` is an Object mapping each board game id to the ids of
 * its expansions, expansions contains the identifiers of the expansions (does not contain the root id), root is
 * bgid_root (root key in the tree).
 */
exports.getBoardGameExpansionsFromDB = async (bgid, transaction) => {
  let fetched = new Set();
  let to_fetch = [bgid];
  let tree = {};
  // fetch all games in the tree
  while (to_fetch.length > 0) {
    const expansions = await db.BoardGameExpansion.findAll({ where: {id_expanded: {[db.Op.in]: to_fetch}}, transaction });
    // indicate as fetched, prepare and fill tree array, refresh to_fetch list
    to_fetch.forEach(id => {
      fetched.add(id);
      tree[id] = [];
    });
    expansions.forEach(exp => tree[exp.id_expanded].push(exp.id_expansion));
    to_fetch = expansions.filter(exp => !fetched.has(exp.id_expansion)).map(exp => exp.id_expansion);
  }
  // remove root from list
  fetched.delete(bgid);
  return {tree: tree, expansions: Array.from(fetched), root: bgid};
};