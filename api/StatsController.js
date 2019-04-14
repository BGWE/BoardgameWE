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

exports.availableRankings = [
    "victory_count", "defeat_count", "victory_prop", "defeat_prop",
    "count_games", "count_unique_games", "is_last", "is_last_prop",
    "gcbgb"
];

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
        const players = game.game_players;
        const bestScore = bestScoreFn(game, players.map(getScore));
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
};

exports.getVictories = function (games) {
    return exports.playersScoreToBinary(games, (game, scores) => {
        if (game.ranking_method === "WIN_LOSE") {
            return 1;
        } else {
            return Math.max.apply(null, scores);
        }
    });
};

exports.getIsLast = function (games) {
    return exports.playersScoreToBinary(games, (game, scores) => {
        if (game.ranking_method === "WIN_LOSE") {
            return 0;
        } else {
            return Math.min.apply(null, scores);
        }
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

/**
 *
 * @param rank_obj
 * @param duration
 * @param n_groups
 * @param win_lose
 * @returns {number}
 */
exports.getGCBGBForPlayer = function(rank_obj, duration, n_groups, win_lose) {
    const rank = rank_obj.rank;
    const score = rank_obj.score;
    const floatDuration = duration < 30 ? 0.5 : Math.floor(duration / 30) / 2;
    const scores = {
        first: floatDuration * 5,
        second: floatDuration * 4,
        third: floatDuration * 2,
        rest: floatDuration
    };

    if (n_groups === 1) {  // all vs game
        return !win_lose || score ? scores.first : scores.third;
    } else if (n_groups === 2) {  // one vs rest
        return rank === 1 ? scores.first : scores.third;
    } else {  // other games
        if (rank === 1) {
            return scores.first;
        } else if (rank === 2) {
            return scores.second;
        } else if (rank === 3) {
            return scores.third;
        } else {
            return scores.rest;
        }
    }
};

exports.getGCBGBRankings = function (games) {
    let gamesList = {}, playersData = {};
    for (let gameIndex = 0; gameIndex < games.length; ++gameIndex) {
        const game = games[gameIndex];
        if (game.duration === null) { // skip games with
            continue;
        }
        const players = game.game_players;
        const game_ranks = util.rank(game.game_players, player => player.score, game.ranking_method === "POINTS_LOWER_BETTER");
        const n_groups = AGGREGATE.count_unique(game_ranks.map(gr => gr.rank));
        for (let playerIndex = 0; playerIndex < game_ranks.length; ++playerIndex) {
            const currPlayer = game_ranks[playerIndex];
            const rank_obj = game_ranks[playerIndex];
            const identifier = currPlayer.name || currPlayer.user.id;
            let array = (identifier in gamesList ? gamesList[identifier] : []);
            array.push(exports.getGCBGBForPlayer(rank_obj, game.duration, n_groups, game.ranking_method === "WIN_LOSE"));
            gamesList[identifier] = array;
            playersData[identifier] = extractPlayerDescriptor(currPlayer);
        }
    }
    return {players: playersData, points: gamesList};
};

exports.computeGameRankings = function(games) {
    let gcbgb = exports.getGCBGBRankings(games),
        victories = exports.getVictories(games),
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
        is_last_prop: util.rankPlayersFromData(is_last, AGGREGATE.freq),
        gcbgb: util.rankPlayersFromData(gcbgb, AGGREGATE.sum)
    };
};

exports.getRankings = function (req, res) {
    let filtering = { where: {}, include: GameController.gameFullIncludeSQ};
    return util.sendModelOrError(res, db.Game.findAll(filtering), games => exports.computeGameRankings(games));
};

exports.getEventRankings = function(req, res) {
    return util.sendModelOrError(res, db.Game.findAll({
        where: {id_event: parseInt(req.params.eid)},
        include: GameController.gameFullIncludesSQ
    }), games => exports.computeGameRankings(games));
};

exports.getEventRanking = function(req, res) {
    return util.sendModelOrError(res, db.Game.findAll({
        where: {id_event: parseInt(req.params.eid)},
        include: GameController.gameFullIncludesSQ
    }), games => {
        const type = req.params.type;
        let result = {data: null, aggr: null};
        if (type === "victory_count") {
            result.data = exports.getVictories(games);
            result.aggr = AGGREGATE.sum;
        } else if (type === "defeat_count") {
            result.data = exports.getDefeats(games);
            result.aggr = AGGREGATE.sum;
        } else if (type === "victory_prop") {
            result.data = exports.getVictories(games);
            result.aggr = AGGREGATE.freq;
        } else if (type === "defeat_prop") {
            result.data = exports.getDefeats(games);
            result.aggr = AGGREGATE.freq;
        } else if (type === "count_games") {
            result.data = exports.getBoardGameCount(games);
            result.aggr = AGGREGATE.count;
        } else if (type === "count_unique_games") {
            result.data = exports.getBoardGameCount(games);
            result.aggr = AGGREGATE.count_unique;
        } else if (type === "is_last") {
            result.data = exports.getIsLast(games);
            result.aggr = AGGREGATE.sum;
        } else if (type === "is_last_prop") {
            result.data = exports.getIsLast(games);
            result.aggr = AGGREGATE.freq;
        } else if (type === "gcbgb") {
            result.data = exports.getGCBGBRankings(games);
            result.aggr = AGGREGATE.sum;
        } else {
            return []
        }
        return util.rankPlayersFromData(result.data, result.aggr);
    });
};
