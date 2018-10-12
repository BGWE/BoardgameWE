'use strict';

const config = require("./config/config.js");
const jwt = require("jsonwebtoken");
const userutil = require("./util/user");

module.exports = function(app) {
    const BoardGameController = require("./BoardGameController");
    const GameController = require("./GameController");
    const StatsController = require("./StatsController");
    const UserController = require("./UserController");
    const EventController = require("./EventController");

    // User routes
    app.route("/user")
        .post(UserController.register);
    app.route("/user/login")
        .post(UserController.signIn);

    // authentication middleware, applied to all except login and register
    app.use(/^\/(?!user\/register|user\/login).*/, function(req, res, next) {
        let token = userutil.getToken(req);
        if (!token) {
            return res.status(401).send({
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
    app.route("/user")
        .put(UserController.updateUser);

    // Library
    app.route("/user/library_games")
        .get(UserController.getCurrentUserLibraryGames)
        .post(UserController.addLibraryGames)
        .delete(UserController.deleteLibraryGames);

    app.route("/user/:uid/library_games")
        .get(UserController.getUserLibraryGames);

    // Event
    app.route("/event")
        .post(EventController.createEvent);

    app.route("/event/:eid")
        .get(EventController.getFullEvent)
        .delete(EventController.deleteEvent);

    app.route("/events")
        .get(EventController.getAllEvents);

    app.route("/event/:eid/board_games")
        .get(EventController.getProvidedBoardGames)
        .post(EventController.addProvidedBoardGames)
        .delete(EventController.deleteProvidedBoardGames);

    // app.route("/event/:eid/participants")
    //     .get(EventController.getParticipants)
    //     .post(EventController.addParticipants)
    //     .delete(EventController.deleteParticipants);

    // Board game
    app.route("/board_game/search")
        .get(BoardGameController.searchBoardGames);

    app.route("/board_game")
        .post(BoardGameController.addBoardGame);

    app.route("/board_game/:bgid")
        .get(BoardGameController.getBoardGame)
        .put(BoardGameController.updateBoardGame)
        .delete(BoardGameController.deleteBoardGame);

    app.route("/board_games")
        .get(BoardGameController.getBoardGames);


    // Game
    app.route("/game")
        .post(GameController.addGame);
    //
    // app.route("/games")
    //     .get(GameController.getGames);
    //
    // app.route("/game/:gid")
    //     .get(GameController.getGame)
    //     .delete(GameController.deleteGame);
    //
    // // Statistics
    // app.route("/stats/rankings")
    //     .get(StatsController.getRankings);
};