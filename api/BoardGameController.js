
const db = require("./models/index");
const bgg = require("./util/bgg");
const util = require("./util/util");

exports.getBoardGame = function(req, res) {
    db.BoardGame.findById(parseInt(req.params.bgid))
        .then(function(boardGame) {
            res.json(boardGame);
        })
        .catch(function (err) {
            res.status(404).send({error: "err"});
        });
};

exports.updateBoardGame = function(req, res) {
    const url = req.body.gameplay_video_url;
    if (url == null || url.length === 0) {
        res.status(400).send("Invalid url");
        return;
    }

    db.BoardGame.findById(parseInt(req.params.bgid))
        .then(function(boardGame) {
            boardGame.gameplay_video_url = url;
            boardGame.save()
                .then((board_game) => {res.status(200).send(board_game);})
                .catch((err) => {res.status(500).send({error: "err"});});
        })
        .catch(function(err) {
            res.status(404).send({error: "err"});
        });
};

exports.addBoardGame = function(req, res) {
    // load info from board game geek
    const bggId = parseInt(req.body.bgg_id);
    bgg.get(bggId, function (err, game) {
        if (err) {
            res.status(404).send({error: "err"});
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
          .error((err) => { res.status(500).send({error: "err"}); });
    });
};

exports.getBoardGames = function(req, res) {
    db.BoardGame.findAll()
        .then((boardGames) => { res.json({"board_games": boardGames}); })
        .error((err) => { res.status(500).send({error: "err"}); });
};

exports.searchBoardGames = function(req, res) {
    const searchQuery = req.query.q;
    if (searchQuery == null || searchQuery.length === 0) {
        res.status(400).send("Invalid search query " + searchQuery + ".");
        return;
    }
    bgg.search(searchQuery, function(err, games) {
        if (err) {
            res.status(500).send({error: "err"});
            return;
        }
        res.status(200).json(games);
    });
};

exports.deleteBoardGame = function(req, res) {
    const bgid = parseInt(req.params.bgid);
    db.Game.findAll({where: {id_board_game: bgid}})
    .then((games) => {
        if (games.length > 0) {
            res.status(400).send({error: "Some games are associated with this board game (id:" + bgid + ")."});
        } else {
            db.BoardGame.destroy({
                where: {id: bgid}
            })
            .then(() => {res.status(200).send({"success": true});})
            .error((err) => {res.status(500).send({error: err});});
        }
    })
    .error((err) => {res.status(500).send({error: err})});
};


// const request = require('request');
// const _api = require("../common/api");
// const _bgg = require("../common/bgg");
// let parse_string = require('xml2js').parseString;
//
// const BGG_ROOT_PATH = 'https://www.boardgamegeek.com/xmlapi2/';
// const DEFAULT_TYPE = 'boardgame';
//
//
// exports.handler = function(event, context, callback) {
//     console.log('Handler');
//
//     function return_error(msg) {
//         console.error(msg);
//         callback(msg)
//     }
//
//     console.log('Received event:', JSON.stringify(event, null, 2));
//
//     if (!event.hasOwnProperty('pathParameters')) {
//         return_error("No game provided (no pathParameters).");
//     }
//
//     if (!("pathParameters" in event)) {
//         return_error("No pathParameters provided.");
//     }
//
//     if (!(event.pathParameters.hasOwnProperty('name'))) {
//         return_error("No Game name provided.");
//     }
//
//     let name = event.pathParameters.name;
//
//     _bgg.search(name, function (err, games) {
//         if (err) return_error(err);
//
//         callback(null, _api.build_response(200, {"data": games}));
//     });
// };
//
//
