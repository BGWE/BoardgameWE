const db = require("./models/index");
const util = require("./util/util");
const EventController = require("./EventController");

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

exports.buildFullGame = (gameId, callback) => {
    return db.Game.findById(gameId)
    .then((game) => {
        return db.BoardGame.findById(game.id_board_game)
        .then((boardGame) => {
            let withBoardGame = Object.assign({board_game: boardGame.dataValues}, game.dataValues);
            return db.GamePlayer.findAll({where: {id_game: game.id}, include: [EventController.userIncludeSQ]})
            .then((players) => {
                callback(Object.assign({players: players}, withBoardGame), null);
            }).catch((err) => {console.log(err); callback(withBoardGame, err);});
        }).catch((err) => {callback(game, err);});
    }).catch((err) => {callback(null, err);});
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
    return util.rank(game.players, (player) => player.score, game.ranking_method === "POINTS_LOWER_BETTER");
};

exports.rankForGameWithDataValues = function(game) {
    return util.rank(game.players.map(a => a.dataValues), (player) => player.score, game.ranking_method === "POINTS_LOWER_BETTER");
};

exports.getGamesQuery = function (success_callback, error_callback) {
    db.GamePlayer.findAll({include: [{model: db.Game, as: "game"}, {model: db.Player, as: "player"}]})
        .then((gamePlayers) => {
            let playedBoardGames = gamePlayers.map((game) => { return game.dataValues.game.id_board_game; });
            db.BoardGame.findAll({where: {id: playedBoardGames}})
                .then((boardGames) => {
                    let gameMap = {};
                    let boardGameMap = util.toDictMapping(boardGames, "id");
                    for (let i in gamePlayers) {
                        if (!gamePlayers.hasOwnProperty(i)) {
                            continue;
                        }
                        let gamePlayer = gamePlayers[i];
                        let idGame = gamePlayer.id_game;
                        if (!gameMap.hasOwnProperty(idGame)) {
                            gameMap[idGame] = Object.assign({
                                players: [],
                                board_game: boardGameMap[gamePlayer.game.id_board_game].dataValues
                            }, gamePlayer.game.dataValues);
                        }
                        gameMap[idGame].players.push({
                            score: gamePlayer.score,
                            id_player: gamePlayer.id_player,
                            player: gamePlayer.player,
                            id_game: gamePlayer.id_game
                        });
                    }

                    // extract object
                    let gameList = [];
                    for (let game in gameMap) {
                        gameMap[game].players = exports.rankForGame(gameMap[game]);
                        gameList.push(gameMap[game]);
                    }

                    success_callback(gameList);
                })
                .catch((err) => {
                    console.log(err);
                    error_callback(err);
                });
        })
        .catch((err) => { error_callback(err); });
};

exports.getGames = function (req, res) {
    exports.getGamesQuery(
        (gamesList) => { res.status(200).send(gamesList); },
        (err) => { res.status(500).send(err); }
    )
};

exports.getGame = function (req, res) {
    exports.buildFullGame(req.params.gid, (fullGame, err) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        fullGame.players = exports.rankForGameWithDataValues(fullGame);
        res.status(200).json(fullGame);
    });
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

