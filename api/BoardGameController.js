
const db = require("db.js");
const bgg = require("util/bgg.js");
let sequelize = db.getSequelize();

exports.getBoardGame = function(req, res) {
    const BoardGame = sequelize.import("models/boardgame");
    BoardGame.findById(parseInt(req.params.bgid), function(err, boardGame) {
        if (err) {
            res.status(404).send(err);
        }
        res.json(boardGame);
    })
};

exports.updateBoardGame = function(req, res) {
    res.status(200).send("coming soon..")
};

exports.addBoardGame = function(req, res) {
    // load info from board game geek
    const bggId = parseInt(req.params.bggid);
    bgg.get(bggId, function (err, game) {
        if (err || game.length !== 1) {
            res.status(404).send(err);
        }

        const BoardGame = sequelize.import("models/boardgame");
        BoardGame.build({
            name: game.name,
            bgg_id: bggId,
            bgg_score: game.score,
            gameplay_video_url: ""
        }).save()
          .then(() => { res.status(200).send(); })
          .error((err) => { res.status(500).send(err); });
    });
};

exports.getBoardGames = function(req, res) {
    const searchQuery = req.query.q;
    if (q == null || q.length > 0) {
        res.status(400).send("Invalid search query.");
        return;
    }
    bgg.search(searchQuery, function(err, games) {
        if (err) {
            res.status(500).send(err);
        }
        res.status(200).json(games);
    })
};

exports.searchBoardGames = function(req, res) {
    res.status(200).send("coming soon..")
};

// let _api = require('../common/api');
// let _dynamo = require('../dynamo/dynamo');
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
//     if (!event.pathParameters) {
//         return_error("No Game ID provided (no pathParameters).");
//     }
//
//     if (!("pathParameters" in event)) {
//         return_error("No pathParameters provided.");
//     }
//
//     if (!("gameid" in event.pathParameters)) {
//         return_error("No Game ID provided.");
//     }
//
//     let gameid = null;
//
//
//     console.log(`Received game ID: ${event.pathParameters.gameid}`);
//     gameid = parseInt(event.pathParameters.gameid);
//     if (!gameid) {
//         console.log(`Failed to parse Game ID: ${gameid}`);
//         callback(null, _api.build_response(400, {"message": "Game ID format is not valid."}))
//     }
//
//     let table = "games";
//     _dynamo.query(table, gameid, "bggid", function (err, data) {
//         if (err) {
//             console.error("Unable to read table. Error JSON:", JSON.stringify(err, null, 2));
//             callback(null, _api.build_response(err.status, err.message))
//         } else {
//             console.log("Scan succeeded:", JSON.stringify(data, null, 2));
//             console.log("Response: ", JSON.stringify(_api.build_response(200, {"data": data.Items[0]}), null, 2));
//             callback(null, _api.build_response(200, {"data": data.Items[0]}))
//         }
//     });
// };