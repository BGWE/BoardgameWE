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

    /**
     * @apiDefine TokenHeaderRequired
     *
     * @apiHeader {String} Authentication User authentication token "JWT {token}"
     */

    /**
     * @apiDefine SourceParameter
     *
     * @apiParam {String} source The source identifier. Currently, only supports 'bgg'.
     * @apiParam {Number} id Board game identifier on the source platform.
     */

    // User routes
    /**
     * @api {post} /user Register user
     * @apiName UserRegister
     * @apiGroup User
     * @apiDescription Create a new user. The created user must be authorized by an admin before being able to access
     * the application data.
     */
    app.route("/user")
        .post(UserController.register);

    /**
     * @api {post} /login Authenticate user
     * @apiName Login
     * @apiGroup Authentication
     * @apiDescription Authenticate a user, returns a Json Web Token (JWT) to pass along with other requests.
     */
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

    /**
     * @api {get} /user/current Get current user
     * @apiName GetCurrentUser
     * @apiGroup User
     * @apiDescription Get current user data.
     * @apiUse TokenHeaderRequired
     */
    app.route("/user/current")
        .get(UserController.getCurrentUser);

    /**
     * @api {put} /user/:id Update user
     * @apiName UpdateUser
     * @apiGroup User
     * @apiDescription Update user data.
     * @apiUse TokenHeaderRequired
     */
    app.route("/user/:uid")
        .put(UserController.updateUser);

    // Library

    /**
     * @api {get} /user/library_games Get library
     * @apiName GetCurrentUserLibrary
     * @apiGroup User library
     * @apiDescription Get the current user's board game library.
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {post} /user/library_games Add to library
     * @apiName AddBoardGameToLibrary
     * @apiGroup User library
     * @apiDescription Add a board game to the current user library.
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {delete} /user/library_games Delete from library
     * @apiName DeleteBoardGameFromLibrary
     * @apiGroup User library
     * @apiDescription Delete a board game from the current user library.
     * @apiUse TokenHeaderRequired
     */
    app.route("/user/library_games")
        .get(UserController.getCurrentUserLibraryGames)
        .post(UserController.addLibraryGames)
        .delete(UserController.deleteLibraryGames);

    /**
     * @api {post} /user/library_games/:source/:id Add to library from source
     * @apiName AddBoardGameFromSourceToLibrary
     * @apiGroup User library
     * @apiDescription Add a new board game from the given source to the application, then add this game to the current
     * user library.
     *
     * @apiUse SourceParameter
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/user/library_game/:source/:id")
        .post(UserController.addBoardGameAndAddToLibrary);

    /**
     * @api {get} /user/:id/library_games Get user library
     * @apiName GetUserLibrary
     * @apiGroup User library
     * @apiDescription Get the specified user's board game library.
     *
     * @apiParam {Number} id User identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/user/:uid/library_games")
        .get(UserController.getUserLibraryGames);

    // Event

    /**
     * @api {post} /event Create event
     * @apiName CreateEvent
     * @apiGroup Event
     * @apiDescription Create an event.
     * @apiUse TokenHeaderRequired
     */
    app.route("/event")
        .post(EventController.createEvent);

    /**
     * @api {get} /event/:id Get event
     * @apiName GetEvent
     * @apiGroup Event
     * @apiDescription Get the specified event data.
     *
     * @apiParam {Number} id The event identifier
     *
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {delete} /event/:id Delete event
     * @apiName DeleteEvent
     * @apiGroup Event
     * @apiDescription Delete the event.
     *
     * @apiParam {Number} id The event identifier
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid")
        .get(EventController.getFullEvent)
        .delete(EventController.deleteEvent);

    /**
     * @api {get} /event/:id Get events
     * @apiName GetEvents
     * @apiGroup Event
     * @apiDescription Get all events.
     *
     * @apiParam {Number} id The event identifier
     * @apiParam (query) {Boolean} ongoing (Optional) If set, filters the events: true for fetching ongoing events only,
     * false for the others.
     * @apiParam (query) {Boolean} registered (Optional) If set, filters the events: true for fetching
     * only the events he has subscribed to, false for the others.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/events")
        .get(EventController.getAllEvents);

    /**
     * @api {post} /event/:eid/board_game/:source/:id Add to event from source
     * @apiName AddBoardGameFromSourceToEvent
     * @apiGroup Event board game
     * @apiDescription Add a new board game from the given source to the application, then add this game to the
     * specified event.
     *
     * @apiUse SourceParameter
     *
     * @apiParam {Number} eid Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/board_game/:source/:id")
        .post(EventController.addBoardGameAndAddToEvent);


    /**
     * @api {get} /event/:id/board_games Get provided board games
     * @apiName GetProvidedBoardGames
     * @apiGroup Event board game
     * @apiDescription Get all the board games brought by the current user to the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {post} /event/:id/board_games Add provided board games
     * @apiName AddProvidedBoardGames
     * @apiGroup Event board game
     * @apiDescription Add all the given board games to the the current user's 'provided' list of the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {delete} /event/:id/board_games Delete provided board games
     * @apiName DeleteProvidedBoardGames
     * @apiGroup Event board game
     * @apiDescription Remove all the given board games to the the current user's 'provided' list of the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/board_games")
        .get(EventController.getProvidedBoardGames)
        .post(EventController.addProvidedBoardGames)
        .delete(EventController.deleteProvidedBoardGames);

    /**
     * @api {post} /event/:id/game Add event game
     * @apiName AddEventGame
     * @apiGroup Event game
     * @apiDescription Add a game at the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/game")
        .post(GameController.addEventGame);

    /**
     * @api {put} /event/:eid/game/:gid Update event game
     * @apiName UpdateEventGame
     * @apiGroup Event game
     * @apiDescription Update a game of the specified event.
     *
     * @apiParam {Number} eid Event identifier.
     * @apiParam {Number} gid Game identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/game/:gid")
        .put(GameController.updateEventGame);

    /**
     * @api {get} /event/:id/games Get event games
     * @apiName GetEventGames
     * @apiGroup Event game
     * @apiDescription Get all the games played at the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/games")
        .get(GameController.getEventGames);

    /**
     * @api {get} /event/:id/games Get recent event game
     * @apiName GetRecentEventGame
     * @apiGroup Event game
     * @apiDescription Get the most recent games of the specified event.
     *
     * @apiParam {Number} id Event identifier.
     * @apiParam (query) {Number} count The number of games to return.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/games/latest")
        .get(GameController.getRecentEventGames);

    /**
     * @api {get} /event/:id/attendees Get event attendees
     * @apiName GetEventAttendees
     * @apiGroup Event attendee
     * @apiDescription Get the specified event attendees.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {post} /event/:id/attendees Add event attendees
     * @apiName AddEventAttendees
     * @apiGroup Event attendee
     * @apiDescription Add attendees to the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {delete} /event/:id/attendees Delete event attendees
     * @apiName DeleteEventAttendees
     * @apiGroup Event attendee
     * @apiDescription Remove attendees from the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/attendees")
        .get(EventController.getEventAttendees)
        .post(EventController.addEventAttendees)
        .delete(EventController.deleteEventAttendees);

    /**
     * @api {post} /event/:id/subscribe Subscribe to event
     * @apiName SubscribeToEvent
     * @apiGroup Event
     * @apiDescription Subscribe the current user to the event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/subscribe")
        .post(EventController.subscribeToEvent);

    /**
     * @api {get} /event/:id/rankings Get event rankings
     * @apiName GetEventRankings
     * @apiGroup Event stats
     * @apiDescription Get all the rankings for the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/rankings")
        .get(StatsController.getEventRankings);

    /**
     * @api {get} /event/:id/ranking/:type Get event ranking
     * @apiName GetEventRanking
     * @apiGroup Event stats
     * @apiDescription Get one ranking for the specified event.
     *
     * @apiParam {Number} id Event identifier.
     * @apiParam {String} type Name of the ranking to fetch. One of: 'victory_count', 'defeat_count', 'victory_prop',
     * 'defeat_prop', 'count_games', 'count_unique_games', 'is_last', 'is_last_prop', 'gcbgb'
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/ranking/:type(" + StatsController.availableRankings.join("|") + ")")
        .get(StatsController.getEventRanking);

    /**
     * @api {get} /events/current Get user events
     * @apiName GetCurrentUserEvents
     * @apiGroup Event
     * @apiDescription Get all the events created by the current user.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/events/current")
        .get(EventController.getCurrentUserEvents);

    // Board game
    /**
     * @api {get} /board_game/search Search board games
     * @apiName SearchBoardGames
     * @apiGroup Board game
     * @apiDescription Search for board games on BGG.
     *
     * @apiParam (query) {String} q The query string.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/board_game/search")
        .get(BoardGameController.searchBoardGames);

    /**
     * @api {post} /board_game Add board game
     * @apiName AddBoardGame
     * @apiGroup Board game
     * @apiDescription Add a board game from BGG to the application.
     *
     * @apiParam (body) {String} bgg_id BGG identifier of the board game.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/board_game")
        .post(BoardGameController.addBoardGame);

    /**
     * @api {get} /board_game/:id Get board game
     * @apiName GetBoardGame
     * @apiGroup Board game
     * @apiDescription Get board game data.
     *
     * @apiParam {String} id Board game (application) identifier.
     *
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {put} /board_game/:id Update board game
     * @apiName UpdateBoardGame
     * @apiGroup Board game
     * @apiDescription Update board game data.
     *
     * @apiParam {String} id Board game (application) identifier.
     *
     * @apiUse TokenHeaderRequired
     */

    /**
     * @api {delete} /board_game/:id Delete board game
     * @apiName DeleteBoardGame
     * @apiGroup Board game
     * @apiDescription Delete board game from the application.
     *
     * @apiParam {String} id Board game (application) identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/board_game/:bgid")
        .get(BoardGameController.getBoardGame)
        .put(BoardGameController.updateBoardGame)
        .delete(BoardGameController.deleteBoardGame);

    /**
     * @api {get} /board_games Get board games
     * @apiName GetBoardGames
     * @apiGroup Board game
     * @apiDescription Get all the board games of the application.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/board_games")
        .get(BoardGameController.getBoardGames);

    // Game
    // Disabled, games are mostly added through event
    // app.route("/game")
    //     .post(GameController.addGame);

    /**
     * @api {get} /game Get game
     * @apiName GetGame
     * @apiGroup Game
     * @apiDescription Get the specified game data
     *
     * @apiParam {String} id Game identifier.
     *
     * @apiUse TokenHeaderRequired
     */
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

    /**
     * @apiPrivate
     * @api {get} /admin/users List users
     * @apiName AdminGetUsers
     * @apiGroup Administration
     * @apiDescription (Admin only) Get the list of registered users.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/admin/users")
        .get(AdminController.getUsers);

    /**
     * @apiPrivate
     * @api {put} /admin/user Authorize user
     * @apiName AdminAuthorizeUser
     * @apiGroup Administration
     * @apiDescription (Admin only) Grant access to the application the the given user
     *
     * @apiParam (body) {Number} id_user User identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/admin/user")
        .put(AdminController.updateUserStatus);

};