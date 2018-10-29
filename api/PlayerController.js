
const db = require("./models/index");

exports.addPlayer = function (req, res) {
    const Player = db.sequelize.import("models/player");
    Player.build({
        email: req.body.email, name: req.body.name
    }).save()
        .then((player) => {res.status(200).json(player);})
        .catch((err) => {res.status(400).send(err);});
};

exports.getPlayer = function (req, res) {
    const Player = db.sequelize.import("models/player");
    Player.findById(parseInt(req.params.pid))
        .then((player) => {res.status(200).json(player);})
        .catch((err) => {res.status(404).send(err);});
};

exports.getPlayers = function (req, res) {
    const Player = db.sequelize.import("models/player");
    Player.findAll()
        .then((players) => {res.status(200).json(players);})
        .catch((err) => {res.status(404).send(err);});
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