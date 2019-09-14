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

exports.getBoardGame = function(req, res) {
    return util.sendModel(res, db.BoardGame.findByPk(parseInt(req.params.bgid), {
      include: exports.boardGameIncludes
    }));
};

exports.updateBoardGame = function(req, res) {
    const url = req.body.gameplay_video_url;
    if (url == null || url.length === 0) {
        return util.detailErrorResponse(res, 400, "Invalid url");
    }
    const bgid = parseInt(req.params.bgid);
    return db.BoardGame.update({
        gameplay_video_url: url
    }, {
        where: {id: bgid},
        fields: ["gameplay_video_url"]
    }).then(() => {
        return util.sendModel(res, db.BoardGame.findByPk(bgid, {
          include: exports.boardGameIncludes
        }));
    });
};

const formatGameFromBggResponse = function(response) {
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
    thumbnail: response.thumbnail[0],
    image: response.image[0],
    description: response.description[0],
    year_published: parseInt(response.yearpublished),
    category: util.listToString(response.boardgamecategory),
    mechanic: util.listToString(response.boardgamemechanic),
    family: util.listToString(response.boardgamefamily)
  };
};

const boardGameFromBggResponse = function(body) {
    const games = bgg.format_get_response(body);
    return games.map(formatGameFromBggResponse);
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
 * @returns {Promise<int>} The bgc identifier of the board game
 */
exports.addBoardGameAndExpensions = async function (bgg_id, transaction) {
  let to_fetch = new Set([bgg_id]);
  // stores fetched bgg data and bgc models, maps bgg id with game data
  let bg_cache = {};

  const create_cache_entry = function (cache, id, model, data, parent) { cache[id] = { parent, model, data }; };
  const cache_has_id = (cache, id) => cache[id] !== undefined;

  // if game was added before expansion support was implemented, we need to check that expansions were already downloaded
  while (to_fetch.size > 0) {
    // fetch data from database and bgg
    to_fetch = Array.from(to_fetch);
    const raw_bgg_items = await bgg.get(to_fetch);
    const bgg_games = bgg.format_get_response(raw_bgg_items);
    const raw_bgc_games = await db.BoardGame.findAll({
      where: {bgg_id: { [db.Op.in]: to_fetch }}, transaction,
      lock: transaction.LOCK.SHARE
    });
    const bgc_games = lodash.zipObject(raw_bgc_games.map(bg => bg.bgg_id), raw_bgc_games);

    // update cache
    for (let i = 0; i < bgg_games.length; ++i) {
      const bgg_game = bgg_games[i];
      const id = bgg_game.id;
      create_cache_entry(bg_cache, id, bgc_games[id] ? bgc_games[id] : null, bgg_game);
    }

    // second pass to create next to_fetch list
    to_fetch = new Set();
    for (let i = 0; i < bgg_games.length; ++i) {
      const bgg_game = bgg_games[i];
      bgg_game.expansion_of.filter(i => !cache_has_id(bg_cache, i)).forEach(i => to_fetch.add(i));
      bgg_game.expansions.filter(i => !cache_has_id(bg_cache, i)).forEach(i => to_fetch.add(i));
    }
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
  // update BoardGameExpension table so that registered expansions are exactly those
  // fetched from bgg
  let queries = lodash.valuesIn(bg_cache).map(entry => {
    return m2m.diffAssociations({
      model_class: db.BoardGameExpansion,
      fixed: { field: 'id_expanded', id: entry.model.id },
      other: {
        field: 'id_expansion',
        ids: entry.data.expansions.map(id => bg_cache[id].model.id)
      },
      options: {transaction}
    })
  });

  await Promise.all(lodash.flatten(queries));
  return bg_cache[bgg_id].model.id;
};