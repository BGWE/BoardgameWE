
const db = require("./models/index");
const bgg = require("./util/bgg");
const util = require("./util/util");

exports.getBoardGame = function(req, res) {
    db.BoardGame.findById(parseInt(req.params.bgid))
        .then(function(boardGame) {
            res.json(boardGame);
        })
        .catch(function (err) {
            res.status(404).send(err);
        });
};

exports.updateBoardGame = function(req, res) {
    const url = req.body.video_url;
    if (url == null || url.length === 0) {
        res.status(400).send("Invalid url");
        return;
    }

    db.BoardGame.findById(parseInt(req.params.bgid))
        .then(function(boardGame) {
            boardGame.gameplay_video_url = url;
            boardGame.save()
                .then(() => {res.sendStatus(200);})
                .catch((err) => {res.status(500).send(err);})
        })
        .catch(function(err) {
            res.status(404).send(err);
        });
};

exports.addBoardGame = function(req, res) {
    // load info from board game geek
    const bggId = parseInt(req.params.bggid);
    bgg.get(bggId, function (err, game) {
        if (err) {
            res.status(404).send(err);
            return;
        }
        db.BoardGame.build({
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
        }).save()
          .then((game) => { res.status(200).json(game); })
          .error((err) => { res.status(500).send(err); });
    });
};

exports.getBoardGames = function(req, res) {
    db.BoardGame.findAll()
        .then((boardGames) => { res.json({"board_games": boardGames}); })
        .error((err) => { res.status(500).send(err); });
};

exports.searchBoardGames = function(req, res) {
    const searchQuery = req.query.q;
    if (searchQuery == null || searchQuery.length === 0) {
        res.status(400).send("Invalid search query " + searchQuery + ".");
        return;
    }
    bgg.search(searchQuery, function(err, games) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.status(200).json(games);
    });
};
