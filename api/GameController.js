const db = require("./models/index");
const util = require("./util/util");
const EventController = require("./EventController");

const gameIncludeSQ = {model: db.Game, as: "game"};
const gamePlayerIncludeSQ = {model: db.GamePlayer, as: "game_players"};
const gameFullIncludesSQ = [
    EventController.boardGameIncludeSQ,
    Object.assign({include: [EventController.userIncludeSQ]}, gamePlayerIncludeSQ)
];

/**
 * Validate ranks from the list
 */
exports.validateRanks = (ranking_method, ranks) => {
    if (ranking_method === "WIN_LOSE") {
        for (let i = 0; i < ranks.length; ++i) {
            if (ranks[i] !== 0 && ranks[i] !== 1) {
                return {valid: false, error: "Invalid rank '" + ranks[i] + "'"};
            }
        }
    } else if (ranking_method !== "POINTS_LOWER_BETTER"
        && ranking_method !== "POINTS_HIGHER_BETTER") {
        return {valid: false, error: "Invalid ranking method '" + ranking_method + "'"};
    }
    return {valid: true};
};

/**
 * Check whether players are correct
 */
exports.validateGamePlayers = (players) => {
    for (let i = 0; i < players.length; ++i) {
        if (!(players[i].hasOwnProperty("user") && players[i].user > 0)  // TODO validate user ids by checking in db
                && !(players[i].hasOwnProperty("name") && players[i].name.length > 0)) {
            return {valid: false, error: "Invalid player. Missing or invalid fields 'name' or 'user'."};
        }
    }
    return {valid: true};
};

exports.buildFullGame = (gameId, res) => {
    return db.Game.find({
        where: {id: gameId}, include: gameFullIncludesSQ
    }).then((game) => {
        game.dataValues.players = exports.rankForGame(game);
        game.dataValues.game_players = undefined; // to keep the more intuitive "players" label in json
        res.status(200).json(game);
    }).catch((err) => {
        res.status(500).json({error: "err"});
    });
};

exports.addGame = function (req, res) {
    const players = req.body.players;
    const idEvent = req.body.id_event || null;
    const idBoardGame = req.body.id_board_game;
    const rankingMethod = req.body.ranking_method;
    const duration = req.body.duration || null;
    const rankingValidation = exports.validateRanks(rankingMethod, players.map((item) => { return item.score; }));
    if (!rankingValidation.valid) {
        res.status(400).send({error: rankingValidation.error});
        return;
    }
    const playersValidation = exports.validateGamePlayers(players);
    if (!playersValidation.valid) {
        res.status(400).send({error: playersValidation.error});
    }
    return db.Game.build({
        id_event: idEvent,
        id_board_game: idBoardGame,
        duration: duration,
        ranking_method: rankingMethod
    }).save()
        .then((game) => {
            const playerGameData = players.map((item) => {
                return {
                    id_game: game.id,
                    score: item.score,
                    id_user: item.user || null,
                    name: item.name || null
                };
            });
            return db.GamePlayer.bulkCreate(playerGameData, {
                returning: true,
                individualHooks: true
            }).then(() => {
                exports.buildFullGame(game.id, (fullGame, err) => {
                    console.log(err);
                    if (err) {
                        res.status(500).send({error: "err"});
                        return;
                    }
                    res.status(200).json(fullGame);
                });
            })
        }).catch((err) => {res.status(500).send({error: "err"})})
};

exports.rankForGame = function(game) {
    return util.rank(game.game_players, (player) => player.score, game.ranking_method === "POINTS_LOWER_BETTER");
};

exports.getGamesQuery = function (filtering, res) {
    // TODO make this more efficient
    let selection = {where: filtering, include: gameFullIncludesSQ};
    return db.Game.findAll({ where: filtering, include: [
        EventController.boardGameIncludeSQ,
        Object.assign({include: [EventController.userIncludeSQ]}, gamePlayerIncludeSQ)
    ]}).then(games => {
        for (let i = 0; i < games.length; ++i) {
            let game = games[i];
            game.dataValues.players = exports.rankForGame(game);
            game.dataValues.game_players = undefined; // to keep the more intuitive "players" label in json
        }
        res.status(200).json(games);
    }).catch(err => {
        res.status(500).json({error: "err"});
    });
};

exports.getGames = function (req, res) {
    return exports.getGamesQuery(undefined, res);
};

exports.getGame = function (req, res) {
    return exports.buildFullGame(parseInt(req.params.gid), res);
};

exports.deleteGame = function (req, res) {
    const gid = parseInt(req.params.gid);
    db.sequelize.transaction((t) => {
        return db.GamePlayer.destroy({where: {id_game: gid}})
            .then(() => {
                db.Game.destroy({where: {id: gid}}, {transaction: t});
            })
    }).then(() => {res.status(200).send({success: true});
    }).error((err) => {res.status(500).send({error: err});});
};


exports.getEventGames = function(req, res) {

};