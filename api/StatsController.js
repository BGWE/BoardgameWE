const GameController = require("./GameController");
const util = require("./util/util");

exports.getVictories = function (games) {
    let victoryPoints = {}, playersData = {};
    for (let gameIndex = 0; gameIndex < games.length; ++gameIndex) {
        const players = games[gameIndex].players;
        for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
            const id_player = players[playerIndex].id_player;
            let array = (id_player in victoryPoints ? victoryPoints[id_player] : []);
            array.push(players[playerIndex].win ? 1 : 0);
            victoryPoints[id_player] = array;
            playersData[id_player] = players[playerIndex].player
        }
    }
    return {players: playersData, points: victoryPoints};
};

exports.getDefeats = function (games) {
    let defeatPoints = {}, victories = exports.getVictories(games);
    let victoryPoints = victories.points;
    for (let id_player in victoryPoints) {
        if (!victoryPoints.hasOwnProperty(id_player)) { continue; }
        defeatPoints[id_player] = victoryPoints[id_player].map((win) => { return !win; });
    }
    return {players: victories.players, points: defeatPoints};
};

exports.getScores = function (results, average) {
    let scores = [];
    for (let playerId in results.players) {
        if (!results.players.hasOwnProperty(playerId)) { continue; }
        let score = results.points[playerId].reduce((acc, curr) => acc + curr);
        scores.push({
            score: average ? score * 1.0 / results.points[playerId].length : score,
            player: results.players[playerId]
        })
    }
    return util.rank(scores, (player) => player.score, false);
};


exports.getRankings = function (req, res) {
    GameController.getGamesQuery((games) => {
        let victories = exports.getVictories(games),
            defeats = exports.getDefeats(games);
        res.status(200).send({
            victory_count: exports.getScores(victories, false),
            defeat_count: exports.getScores(defeats, false),
            victory_prop: exports.getScores(victories, true),
            defeat_prop: exports.getScores(defeats, true)
        });
    }, (err) => {res.status(500).send({error: err});});
};