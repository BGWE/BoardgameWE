const db = require("./models/index");
const GameController = require("./GameController");
const util = require("./util/util");

const AGGREGATE = {
    sum: (array) => array.reduce((acc, curr) => acc + curr),
    freq: (array) => array.reduce((acc, curr) => acc + curr) * 1.0 / array.length,
    count: (array) => array.length,
    count_unique: (array) => util.unique(array).length
};

exports.getVictories = function (games) {
    let victoryPoints = {}, playersData = {};
    for (let gameIndex = 0; gameIndex < games.length; ++gameIndex) {
        const players = games[gameIndex].game_players;
        for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
            const currPlayer = players[playerIndex];
            const identifier = currPlayer.name || currPlayer.user.id;
            let array = (identifier in victoryPoints ? victoryPoints[identifier] : []);
            array.push(players[playerIndex].win ? 1 : 0);
            victoryPoints[identifier] = array;
            playersData[identifier] = players[playerIndex]
        }
    }
    return {players: playersData, points: victoryPoints};
};

exports.getDefeats = function (games) {
    let defeatPoints = {}, victories = exports.getVictories(games);
    let victoryPoints = victories.points;
    for (let id_player in victoryPoints) {
        if (!victoryPoints.hasOwnProperty(id_player)) { continue; }
        defeatPoints[id_player] = victoryPoints[id_player].map(win => !win ? 1 : 0);
    }
    return {players: victories.players, points: defeatPoints};
};

exports.getIsLast = function (games) {
    let lastPoints = {}, playersData = {};
    for (let gameIndex = 0; gameIndex < games.length; ++gameIndex) {
        const getScore = games[gameIndex].ranking_method === "POINTS_LOWER_BETTER" ? (p => -p.score) : (p => p.score);
        const players = games[gameIndex].game_players;
        const lastScore = Math.min.apply(null, players.map(getScore));

        for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
            const currPlayer = players[playerIndex];
            const identifier = currPlayer.name || currPlayer.user.id;
            let array = (identifier in lastPoints ? lastPoints[identifier] : []);
            array.push(getScore(players[playerIndex]) === lastScore ? 1 : 0);
            lastPoints[identifier] = array;
            playersData[identifier] = players[playerIndex];
        }
    }
    return {players: playersData, points: lastPoints};
};

exports.getBoardGameCount = function (games) {
    let gamesList = {}, playersData = {};
    for (let gameIndex = 0; gameIndex < games.length; ++gameIndex) {
        const players = games[gameIndex].game_players;
        for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
            const currPlayer = players[playerIndex];
            const identifier = currPlayer.name || currPlayer.user.id;
            let array = (identifier in gamesList ? gamesList[identifier] : []);
            array.push(games[gameIndex].id_board_game);
            gamesList[identifier] = array;
            playersData[identifier] = players[playerIndex]
        }
    }
    return {players: playersData, points: gamesList};
};

exports.getRankings = function (req, res) {
    let filtering = { where: {id_event: parseInt(req.params.eid)}, include: GameController.gameFullIncludeSQ};
    return db.Game.findAll(filtering)
        .then(games => {
            let victories = exports.getVictories(games),
                defeats = exports.getDefeats(games),
                board_game_count = exports.getBoardGameCount(games),
                is_last = exports.getIsLast(games);
            res.status(200).send({
                victory_count: util.rankPlayersFromData(victories, AGGREGATE.sum),
                defeat_count: util.rankPlayersFromData(defeats, AGGREGATE.sum),
                victory_prop: util.rankPlayersFromData(victories, AGGREGATE.freq),
                defeat_prop: util.rankPlayersFromData(defeats, AGGREGATE.freq),
                count_games: util.rankPlayersFromData(board_game_count, AGGREGATE.count),
                count_unique_games: util.rankPlayersFromData(board_game_count, AGGREGATE.count_unique),
                is_last: util.rankPlayersFromData(is_last, AGGREGATE.sum),
                is_last_prop: util.rankPlayersFromData(is_last, AGGREGATE.freq)
            });
        }).catch((err) => {
            res.status(500).send({error: err});
        });
};

exports.getEventRankings = function(req, res) {
    // TODO
};