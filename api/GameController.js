const db = require("./db");
let sequelize = db.getSequelize();

exports.buildFullGame = (gameId, callback) => {
    const BoardGame = sequelize.import("models/boardgame");
    const Game = sequelize.import("models/game");
    const GamePlayer = sequelize.import("models/gameplayer");
    const Player = sequelize.import("models/player");

    Game.findById(gameId)
    .then((game) => {
        BoardGame.findById(game.id_board_game)
        .then((boardGame) => {
            let withBoardGame = Object.assign({board_game: boardGame.dataValues}, game.dataValues);
            GamePlayer.findAll({where: {id_game: game.id}, include: [Player]})
            .then((players) => {
                callback(Object.assign({players: players}, withBoardGame), null);
            }).catch((err) => {callback(withBoardGame, err);});
        }).catch((err) => {callback(game, err);});
    }).catch((err) => {callback(null, err);});
};

exports.addGame = function (req, res) {
    const players = req.body.players;
    const id_board_game = req.body.board_game;
    const duration = req.body.duration || null;
    const Game = sequelize.import("models/game");
    const GamePlayer = sequelize.import("models/gameplayer");
    Game.build({
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
            GamePlayer.bulkCreate(insertData, {
                returning: true,
                individualHooks: true
            }).then(() => {
                exports.buildFullGame(game.id, (fullGame, err) => {
                    console.log(fullGame);
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
    // TODO
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
