
const db = require("./db");
const bgg = require("./util/bgg");
let sequelize = db.getSequelize();

exports.getBoardGame = function(req, res) {
    const BoardGame = sequelize.import("models/boardgame");
    BoardGame.findById(parseInt(req.params.bgid))
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

    const BoardGame = sequelize.import("models/boardgame");
    BoardGame.findById(parseInt(req.params.bgid))
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
        const BoardGame = sequelize.import("models/boardgame");
        BoardGame.build({
            name: game.name,
            bgg_id: bggId,
            bgg_score: game.score,
            gameplay_video_url: ""
        }).save()
          .then(() => { res.sendStatus(200); })
          .error((err) => { res.status(500).send(err); });
    });
};

exports.getBoardGames = function(req, res) {
    const BoardGame = sequelize.import("models/boardgame");
    BoardGame.findAll()
        .then((boardGames) => { res.json(boardGames); })
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
