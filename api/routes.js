'use strict';

const config = require("./config/config.js");
const jwt = require("jsonwebtoken");
const userutil = require("./util/user");
const util = require("./util/util");
const db = require("./models/index");

module.exports = function(app) {
    const BoardGameController = require("./BoardGameController");
    const GameController = require("./GameController");
    const StatsController = require("./StatsController");
    const UserController = require("./UserController");
    const EventController = require("./EventController");
    const AdminController = require("./AdminController");

    // User routes
    app.route("/user")
        .post(UserController.register);
    app.route("/user/login")
        .post(UserController.signIn);

    // authentication middleware, applied to all except login and register
    app.use(/^\/(?!user\/register|user\/login).*/, function(req, res, next) {
        let token = userutil.getToken(req);
        if (!token) {
            return util.detailErrorResponse(res, 401, "No token provided.");
        }
        jwt.verify(token, config.jwt_secret_key, function(err, decoded) {
            if (err) {
                return util.detailErrorResponse(res, 401, "Failed to authenticate token.");
            } else {
                // if everything is good, save to request for use in other route
                req.decoded = decoded;
                // check that current user still exists and is validated !
                return db.User.findById(decoded.id)
                    .then(user => {
                        if (user.validated) {
                            req.is_admin = user.admin;
                            return next();
                        } else {
                            return util.detailErrorResponse(res, 403, UserController.notValidatedErrorMsg);
                        }
                    }).catch(err => {
                        // user doesn't exist anymore (shouldn't happen)
                        return util.detailErrorResponse(res, 401, "Unknown user.");
                    });
            }
        });
    });

    // User (protected)
    app.route("/user/current")
        .get(UserController.getCurrentUser);

    app.route("/user/:uid")
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

    app.route("/event/:eid/game")
        .post(GameController.addEventGame);

    app.route("/event/:eid/games")
        .get(GameController.getEventGames);

    app.route("/event/:eid/attendees")
        .get(EventController.getEventAttendees)
        .post(EventController.addEventAttendees)
        .delete(EventController.deleteEventAttendees);

    app.route("/event/:eid/subscribe")
        .post(EventController.subscribeToEvent);

    app.route("/event/:eid/rankings")
        .get(StatsController.getEventRankings);

    app.route("/events/current")
        .get(EventController.getCurrentUserEvents);

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
    // Disabled, games are mostly added through event
    // app.route("/game")
    //     .post(GameController.addGame);

    app.route("/game/:gid")
        .get(GameController.getGame)
        .delete(GameController.deleteGame);

    // Disabled, games are mostly seen through event
    // app.route("/games")
    //     .get(GameController.getGames);

    // Statistics
    // Disabled, rankings are mostly seen through event
    // app.route("/stats/rankings")
    //     .get(StatsController.getRankings);

    // admin middleware
    app.use(/\/admin\/.*/, function(req, res, next) {
        if (!req.is_admin) { // is_admin is set in the authentication middleware
            return util.detailErrorResponse(res, 403, "You are not an administrator.");
        } else {
            return next();
        }
    });

    app.route("/admin/users")
        .get(AdminController.getUsers);

    app.route("/admin/user")
        .put(AdminController.updateUserStatus);

};