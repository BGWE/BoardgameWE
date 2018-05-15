const db = require("./models/index");
const util = require("./util/util");

exports.validateRanks = (ranking_method, ranks) => {
    /**
     * Validate ranks from the list
     */
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


exports.buildFullGame = (gameId, callback) => {
    db.Game.findById(gameId)
    .then((game) => {
        db.BoardGame.findById(game.id_board_game)
        .then((boardGame) => {
            let withBoardGame = Object.assign({board_game: boardGame.dataValues}, game.dataValues);
            db.GamePlayer.findAll({where: {id_game: game.id}, include: [{model: db.Player, as: "player"}]})
            .then((players) => {
                callback(Object.assign({players: players}, withBoardGame), null);
            }).catch((err) => {console.log(err); callback(withBoardGame, err);});
        }).catch((err) => {callback(game, err);});
    }).catch((err) => {callback(null, err);});
};

exports.addGame = function (req, res) {
    const players = req.body.players;
    const id_board_game = req.body.board_game;
    const ranking_method = req.body.ranking_method;
    const duration = req.body.duration || null;
    const ranking_validation = exports.validateRanks(ranking_method, players.map((item) => { return item.score; }));
    if (!ranking_validation.valid) {
        res.status(400).send({error: ranking_validation.error});
        return;
    }
    db.Game.build({
        id_board_game: id_board_game,
        duration: duration,
        ranking_method: ranking_method
    }).save()
        .then((game) => {
            const playerGameData = players.map((item) => {
                return {
                    id_game: game.id,
                    rank: item.score,
                    id_player: item.player
                };
            });
            db.GamePlayer.bulkCreate(playerGameData, {
                returning: true,
                individualHooks: true
            }).then(() => {
                exports.buildFullGame(game.id, (fullGame, err) => {
                    console.log(err);
                    if (err) {
                        res.status(500).send(err);
                        return;
                    }
                    res.status(200).json(fullGame);
                });
            })
        }).catch((err) => {res.status(500).send(err)})
};

exports.rankForGame = function(game) {
    return util.rank(game.players, (player) => player.rank, game.ranking_method === "POINTS_LOWER_BETTER");
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
                            rank: gamePlayer.rank,
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
            res.status(404).send(err);
            return;
        }
        fullGame.players = exports.rankForGame(fullGame);
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
    })
    .then(() => {res.status(200).send({success: true});})
    .error((err) => {res.status(500).send({error: err});});
};

