const db = require("./models/index");
const util = require("./util/util");


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
    const duration = req.body.duration || null;
    db.Game.build({
        id_board_game: id_board_game,
        duration: duration
    }).save()
        .then((game) => {
            let insertData = players.map((item) => {
                return {
                    id_game: game.id,
                    rank: item.rank,
                    id_player: item.player
                };
            });
            db.GamePlayer.bulkCreate(insertData, {
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

exports.getGames = function (req, res) {
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
                    gameList.push(gameMap[game]);
                }

                res.status(200).json({"games": gameList});
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send(err);
            });
    })
    .catch((err) => {console.log(err); res.status(500).send(err);});
};

exports.getGame = function (req, res) {
    exports.buildFullGame(req.params.gid, (fullGame, err) => {
        if (err) {
            res.status(404).send(err);
            return;
        }
        res.status(200).json(fullGame);
    });
};
