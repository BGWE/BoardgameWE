const db = require("./models/index");
const GameController = require("./GameController");
const util = require("./util/util");

const AGGREGATE = {
    sum: (array) => array.reduce((acc, curr) => acc + curr),
    freq: (array) => array.reduce((acc, curr) => acc + curr) * 1.0 / array.length,
    count: (array) => array.length,
    count_unique: (array) => util.unique(array).length
};

const extractPlayerDescriptor = (gamePlayer) => {
    return {
        user: gamePlayer.user,
        id_user: gamePlayer.id_user,
        name: gamePlayer.name,
    };
};

/**
 * Returns a function to extract a score number.
 * This score number can be used as sorting criterion to rank according to the ranking method.
 */
const getPlayerRankableScoreFn = function(game) {
    return game.ranking_method === "POINTS_LOWER_BETTER" ? (p => -p.score) : (p => p.score);
};

exports.playersScoreToBinary = function(games, bestScoreFn) {
    /**
     * Compute binary score for each player based on a best score function. For a given game, all players of which the
     * score equals the score returned by bestScoreFn receive one point, other receive 0.
     * @param games The games on which to compute the binary scores
     * @param bestScoreFn The best scores function
     * @returns {{players, points}}
     */
    let binaryPoints = {}, playersData = {};
    for (let gameIndex = 0; gameIndex < games.length; ++gameIndex) {
        const game = games[gameIndex];
        const getScore = getPlayerRankableScoreFn(game);
        const players = games[gameIndex].game_players;
        const bestScore = bestScoreFn(players.map(getScore));
        for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
            const currPlayer = players[playerIndex];
            const identifier = currPlayer.name || currPlayer.user.id;
            let array = (identifier in binaryPoints ? binaryPoints[identifier] : []);
            array.push(getScore(players[playerIndex]) === bestScore ? 1 : 0);
            binaryPoints[identifier] = array;
            playersData[identifier] = extractPlayerDescriptor(players[playerIndex]);
        }
    }
    return {players: playersData, points: binaryPoints};
}

exports.getVictories = function (games) {
    return exports.playersScoreToBinary(games, (scores) => {
        return Math.max.apply(null, scores);
    })
};

exports.getIsLast = function (games) {
    return exports.playersScoreToBinary(games, (scores) => {
        return Math.min.apply(null, scores);
    });
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
            playersData[identifier] = extractPlayerDescriptor(players[playerIndex]);
        }
    }
    return {players: playersData, points: gamesList};
};

exports.computeGameRankings = function(games) {
    let victories = exports.getVictories(games),
        defeats = exports.getDefeats(games),
        board_game_count = exports.getBoardGameCount(games),
        is_last = exports.getIsLast(games);
    return {
        victory_count: util.rankPlayersFromData(victories, AGGREGATE.sum),
        defeat_count: util.rankPlayersFromData(defeats, AGGREGATE.sum),
        victory_prop: util.rankPlayersFromData(victories, AGGREGATE.freq),
        defeat_prop: util.rankPlayersFromData(defeats, AGGREGATE.freq),
        count_games: util.rankPlayersFromData(board_game_count, AGGREGATE.count),
        count_unique_games: util.rankPlayersFromData(board_game_count, AGGREGATE.count_unique),
        is_last: util.rankPlayersFromData(is_last, AGGREGATE.sum),
        is_last_prop: util.rankPlayersFromData(is_last, AGGREGATE.freq)
    };
};

exports.getRankings = function (req, res) {
    let filtering = { where: {}, include: GameController.gameFullIncludeSQ};
    return db.Game.findAll(filtering)
        .then(games => {
            res.status(200).send(exports.computeGameRankings(games));
        }).catch((err) => {
            res.status(500).send({error: err});
        });
};

exports.getEventRankings = function(req, res) {
    let filtering = { where: {id_event: parseInt(req.params.eid)}, include: GameController.gameFullIncludeSQ};
    return db.Game.findAll(filtering)
        .then(games => {
            res.status(200).send(exports.computeGameRankings(games));
        }).catch((err) => {
            res.status(500).send({error: err});
        });
};