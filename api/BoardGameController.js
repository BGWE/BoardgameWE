
const db = require("./models/index");
const bgg = require("./util/bgg");
const util = require("./util/util");

exports.getBoardGame = function(req, res) {
    return util.sendModelOrError(res, db.BoardGame.findById(parseInt(req.params.bgid)));
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
        return util.sendModelOrError(res, db.BoardGame.findById(bgid));
    }).catch(err => {
        return util.errorResponse(res);
    });
};

exports.addBoardGame = function(req, res) {
    // load info from board game geek
    const bggId = parseInt(req.body.bgg_id);
    return bgg.get(bggId).then(body => {
        const game = bgg.format_get_response(body);
        return util.sendModelOrError(res, db.BoardGame.create({
            name: game.name,
            bgg_id: bggId,
            bgg_score: game.score,
            gameplay_video_url: null,
            min_players: parseInt(game.minplayers),
            max_players: parseInt(game.maxplayers),
            min_playing_time: parseInt(game.maxplaytime),
            max_playing_time: parseInt(game.minplaytime),
            playing_time: parseInt(game.playingtime),
            thumbnail: game.thumbnail[0],
            image: game.image[0],
            description: game.description[0],
            year_published: parseInt(game.yearpublished),
            category: util.listToString(game.boardgamecategory),
            mechanic: util.listToString(game.boardgamemechanic),
            family: util.listToString(game.boardgamefamily)
        }));
    }).catch(err => {
        return util.detailErrorResponse(res, 404, "could not fetch game from board game geek");
    });

};

exports.getBoardGames = function(req, res) {
    return util.sendModelOrError(res, db.BoardGame.findAll());
};

exports.searchBoardGames = function(req, res) {
    const searchQuery = req.query.q;
    if (searchQuery == null || searchQuery.length === 0) {
        return util.detailErrorResponse(res, 400, "Invalid search query " + searchQuery + ".");
    }
    return bgg.search(searchQuery)
        .then(body => {
            return util.successResponse(res, bgg.format_search_response(body));
        }).catch(err => {
            return util.errorResponse(res);
        });
};

exports.deleteBoardGame = function(req, res) {
    const bgid = parseInt(req.params.bgid);
    return util.handleDeletion(res, db.BoardGame.destroy({ where: {id: bgid} }));
};
