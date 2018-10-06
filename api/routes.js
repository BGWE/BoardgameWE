'use strict';

const config = require("./config/config.js");
const jwt = require("jsonwebtoken");

module.exports = function(app) {
    const BoardGameController = require("./BoardGameController");
    const PlayerController = require("./PlayerController");
    const GameController = require("./GameController");
    const StatsController = require("./StatsController");
    const UserController = require("./UserController");

    // User routes
    app.route("/user/register")
        .post(UserController.register);
    app.route("/user/login")
        .post(UserController.signIn);

    // authentication middleware, applied to all except login and register
    app.use(/^\/(?!user\/register|user\/login).*/, function(req, res, next) {
        let token = UserController.getToken(req);
        if (!token) {
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });
        }
        jwt.verify(token, config.jwt_secret_key, function(err, decoded) {
            if (err) {
                return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    });

    // User (protected)
    app.route("/user/update")
        .put(UserController.updateUser);

    // Library
    app.route("/user/library/games")
        .post(UserController.addLibraryGames)
        .delete(UserController.deleteLibraryGames);

    // Board game
    app.route("/board_game/search")
        .get(BoardGameController.searchBoardGames);

    app.route("/board_game/:bgid")
        .get(BoardGameController.getBoardGame)
        .post(BoardGameController.updateBoardGame)
        .delete(BoardGameController.deleteBoardGame);

    app.route("/board_game/:bggid")
        .put(BoardGameController.addBoardGame);

    app.route("/board_games")
        .get(BoardGameController.getBoardGames);

    // Player
    app.route("/player")
        .put(PlayerController.addPlayer);

    app.route("/player/:pid")
        .get(PlayerController.getPlayer);

    app.route("/players")
        .get(PlayerController.getPlayers);


    // Game
    app.route("/game")
        .put(GameController.addGame);

    app.route("/games")
        .get(GameController.getGames);

    app.route("/game/:gid")
        .get(GameController.getGame)
        .delete(GameController.deleteGame);

    // Statistics
    app.route("/stats/rankings")
        .get(StatsController.getRankings);
};