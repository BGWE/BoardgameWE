'use strict';

const config = require("./config/config.js");
const jwt = require("jsonwebtoken");
const userutil = require("./util/user");
const util = require("./util/util");
const db = require("./models/index");
const _ = require("lodash");

module.exports = function(app) {
    const { body, param, check, query } = require('express-validator/check');
    const { asyncMiddleware } = require('./util/util');
    const validation = require('./util/validation');
    const BoardGameController = require("./BoardGameController");
    const GameController = require("./GameController");
    const StatsController = require("./StatsController");
    const UserController = require("./UserController");
    const EventController = require("./EventController");
    const EventJoinController = require("./EventJoinController");
    const AdminController = require("./AdminController");
    const TimerController = require("./TimerController");
    const AppWideController = require("./AppWideController");
    const access_checks = require('./util/access_checks');

    // User routes
    /**
     * @api {post} /user Register user
     * @apiName UserRegister
     * @apiGroup User
     * @apiDescription Create a new user. The created user must be authorized by an admin before being able to access
     * the application data.
     *
     * @apiUse UserDescriptor
     * @apiUse DBDatetimeFields
     */
    app.route("/user")
        .post(UserController.register);

    /**
     * @api {post} /user/login Authenticate user
     * @apiName Login
     * @apiGroup Authentication
     * @apiDescription Authenticate a user, returns a Json Web Token (JWT) to pass along with other requests.
     *
     * @apiSuccess {String} token JSON Web Token
     */
    app.route("/user/login")
        .post(UserController.signIn);

    /**
     * @api {post} /user/forgot_password Send password recovery email
     * @apiName ForgotPassword
     * @apiGroup User
     * @apiDescription Send password recovery email for user linked to the email address.
     * 
     * @apiParam (body) {String} email Email of the user that has forgotten the associated password.
     */
    app.route("/user/forgot_password")
        .post(UserController.forgotPassword);

    /**
     * @api {get} /statistics Get application statistics
     * @apiName GetAppStatistics
     * @apiGroup Application
     * @apiDescription Get application statistics
     * @apiSuccess {Number} games_count Number of games played overall
     * @apiSuccess {Number} users_count Number of active users
     * @apiSuccess {Number} board_games_owned_count Number of board games owned by players on the application
     * @apiSuccess {Number} events_count Number of organized events
     */
    app.route("/statistics")
        .get(AppWideController.getAppStatistics);

    /**
     * @api {post} /user/reset_password Reset the password of a user
     * @apiName ResetPassword
     * @apiGroup User
     * @apiDescription Reset the password of a user by another one given in the payload. This uses the token provided in the ForgotPassword API.
     * 
     * @apiParam (body) {String} token Reset password token.
     * @apiParam (body) {String} id User ID.
     * @apiParam (body) {String} password New password.
     */
    app.route("/user/reset_password")
        .post(UserController.resetPassword);

    // authentication middleware, applied to all except login and register
    app.use(/^\/(?!user\/register|user\/login|auth\/forgot_password|auth\/reset_password|statistics).*/, asyncMiddleware(async function(req, res, next) {
        let token = userutil.getToken(req);
        if (!token) {
            return util.detailErrorResponse(res, 401, "No token provided.");
        }
        const verified = jwt.verify(token, config.jwt_secret_key, (error, decoded) => { return { error, decoded }; });
        if (verified.error) {
            return util.detailErrorResponse(res, 401, "Failed to authenticate token.");
        }
        try {
            const user = await db.User.findByPk(verified.decoded.id);
            if (!user.validated) {
                return util.detailErrorResponse(res, 403, UserController.notValidatedErrorMsg);
            }
            req.decoded = verified.decoded;
            req.is_admin = user.admin;
            next();
        } catch (err) {
            return util.detailErrorResponse(res, 401, "Unknown user.");
        }
    }));


    // User (protected)
    const user_access = {
        read: access_checks.get_user_access_callback(access_checks.ACCESS_READ),
        write: access_checks.get_user_access_callback(access_checks.ACCESS_WRITE),
        list: access_checks.get_user_access_callback(access_checks.ACCESS_LIST)
    };

    /**
     * @api {get} /user/current Get current user
     * @apiName GetCurrentUser
     * @apiGroup User
     * @apiDescription Get current user data.
     * @apiUse TokenHeaderRequired
     *
     * @apiUse UserDescriptor
     * @apiUse DBDatetimeFields
     */
    app.route("/user/current")
        .get(UserController.getCurrentUser);

    /**
     * @api {get} /user/:id Get user
     * @apiName GetUser
     * @apiGroup User
     * @apiDescription Get the specified user data. Can only be executed against friends of the current user.
     * @apiUse TokenHeaderRequired
     *
     * @apiParam {Number} id The user identifier
     *
     * @apiUse UserDescriptor
     * @apiUse DBDatetimeFields
     */

    /**
     * @api {put} /user/:id Update user
     * @apiName UpdateUser
     * @apiGroup User
     * @apiDescription Update user data.
     * @apiUse TokenHeaderRequired
     *
     * @apiParam {Number} id User identifier
     * @apiUse UserDescriptor
     * @apiUse DBDatetimeFields
     */
    app.route("/user/:uid")
        .get(user_access.read, UserController.getUser)
        .put(user_access.write, UserController.updateUser);

    /**
     * @api {get} /user/:id/stats Get user stats
     * @apiName GetUserStats
     * @apiGroup User
     * @apiDescription Get user statistics. Can only be executed against friends of the current user.
     * @apiUse TokenHeaderRequired
     * @apiParam {Number} id User identifier
     * @apiSuccess {Number} played Number of games played so far.
     * @apiSuccess {Number} attended Number of events attended.
     * @apiSuccess {Number} owned Number of distinct board games owned.
     * @apiSuccess {Object} most_played Most played board game
     * @apiSuccess {Number} most_played.count Number of times played
     * @apiSuccess {BoardGame} most_played.board_game Board game data (see "Add board game" request for structure), `null` if no game played.
     * @apiSuccess {Number} play_time Total play time of the user (in minutes)
     */
    app.route("/user/:uid/stats")
        .get(user_access.read, UserController.getUserStats);

    /**
     * @api {get} /user/:id/activities Get user activities
     * @apiName GetUserActivities
     * @apiGroup User
     * @apiDescription Get user latest activities on the application. Can only be executed against friends of the current user.
     * @apiUse TokenHeaderRequired
     * @apiParam {Number} id User identifier
     *
     * @apiSuccess {Activity[]} activities List of activities. Note: the returned data is a list (not an actual object).
     * @apiSuccess {String} activities.type Type of activities among: `{'user/join_event', 'user/play_game', 'user/library_add'}`.
     * @apiSuccess {String} activities.datetime When the activity occurred (iso8601, UTC)
     * @apiSuccess {BoardGame} activities.board_game (only for `user/play_game` and `user/library_add` activities) Board game data
     * (see "Add board game" request for structure).
     * @apiSuccess {Event} activities.event (only for `user/join_event` activity) Event data (see "Add event game" for Game structure).
     */
    app.route("/user/:uid/activities")
        .get(user_access.read, UserController.getUserActivities);

    // Library
    /**
     * @api {get} /user/current/library_games Get library
     * @apiName GetCurrentUserLibrary
     * @apiGroup User library
     * @apiDescription Get the current user's board game library.
     * @apiUse TokenHeaderRequired
     * @apiUse LibraryBoardGamesListDescriptor
     */

    /**
     * @api {post} /user/current/library_games Add to library
     * @apiName AddBoardGameToLibrary
     * @apiGroup User library
     * @apiDescription Add a board game to the current user library.
     * @apiUse TokenHeaderRequired
     * @apiParam {Number[]} board_games List of identifiers of the board games to add to the user library.
     *
     * @apiUse LibraryBoardGamesListDescriptor
     */

    /**
     * @api {delete} /user/current/library_games Delete from library
     * @apiName DeleteBoardGameFromLibrary
     * @apiGroup User library
     * @apiDescription Delete a board game from the current user library.
     * @apiUse TokenHeaderRequired
     *
     * @apiUse LibraryBoardGamesListDescriptor
     */
    app.route("/user/current/library_games")
        .get(UserController.getCurrentUserLibraryGames)
        .post([body('board_games').isArray().not().isEmpty()], validation.validateOrBlock('cannot update game library'), UserController.addLibraryGames)
        .delete([body('board_games').isArray().not().isEmpty()], validation.validateOrBlock('cannot update game library'), UserController.deleteLibraryGames);

    /**
     * @api {post} /user/current/library_games/:source/:id Add to library from source
     * @apiName AddBoardGameFromSourceToLibrary
     * @apiGroup User library
     * @apiDescription Add a new board game from the given source to the application, then add this game to the current
     * user library.
     * @apiUse SourceParameter
     * @apiUse TokenHeaderRequired
     * @apiUse LibraryBoardGamesListDescriptor
     */
    app.route("/user/current/library_game/:source/:id")
        .post(UserController.addBoardGameAndAddToLibrary);

    /**
     * @api {get} /user/:id/library_games Get user library
     * @apiName GetUserLibrary
     * @apiGroup User library
     * @apiDescription Get the specified user's board game library. Can only be executed against friends of the current user.
     * @apiParam {Number} id User identifier.
     * @apiUse TokenHeaderRequired
     * @apiUse LibraryBoardGamesListDescriptor
     */
    app.route("/user/:uid/library_games")
        .get(user_access.read, UserController.getUserLibraryGames);

    // Wish to play list
    /**
     * @api {get} /user/current/wish_to_play Get wish to play list
     * @apiName GetCurrentUserWishToPlayList
     * @apiGroup User wish to play
     * @apiDescription Get the current user's board game wish to play list.
     * @apiUse TokenHeaderRequired
     * @apiUse WishToPlayBoardGamesListDescriptor
     */

    /**
     * @api {post} /user/current/wish_to_play Add to wish to play list
     * @apiName AddBoardGameToWishToPlayList
     * @apiGroup User wish to play
     * @apiDescription Add a board game to the current user wish-to-play list.
     * @apiParam {Number[]} board_games List of identifiers of the board games to add to the user wish to play list .
     * @apiUse TokenHeaderRequired
     * @apiUse WishToPlayBoardGamesListDescriptor
     */

    /**
     * @api {delete} /user/current/wish_to_play Delete wish to play list
     * @apiName DeleteBoardGameFromWishToPlayList
     * @apiGroup User wish to play
     * @apiDescription Delete a board game from the current user wish-to-play list.
     * @apiUse TokenHeaderRequired
     *
     * @apiUse WishToPlayBoardGamesListDescriptor
     */
    app.route("/user/current/wish_to_play")
        .get(UserController.getCurrentUserWishToPlayBoardGames)
        .post([body('board_games').isArray().not().isEmpty()], validation.validateOrBlock('cannot update wish to play list'), UserController.addToWishToPlayBoardGames)
        .delete([body('board_games').isArray().not().isEmpty()], validation.validateOrBlock('cannot update wish to play list'), UserController.deleteFromWishToPlayList);

    /**
     * @api {post} /user/current/wish_to_play/:source/:id Add to wish to play list from source
     * @apiName AddBoardGameFromSourceToWishToPlayList
     * @apiGroup User wish to play
     * @apiDescription Add a new board game from the given source to the application, then add this game to the current
     * user wish-to-play list.
     * @apiUse SourceParameter
     * @apiUse TokenHeaderRequired
     * @apiUse WishToPlayBoardGamesListDescriptor
     */
    app.route("/user/current/wish_to_play/:source/:id")
        .post(UserController.addBoardGameAndAddToWishToPlay);

    /**
     * @api {get} /user/:id/wish_to_play Get user wish to play list
     * @apiName GetUserWishToPlayList
     * @apiGroup User wish to play
     * @apiDescription Get the specified user's wish to play board games. Can only be executed against friends of the current user.
     * @apiParam {Number} id User identifier.
     * @apiUse TokenHeaderRequired
     * @apiUse WishToPlayBoardGamesListDescriptor
     */
    app.route("/user/:uid/wish_to_play")
        .get(user_access.read, UserController.getUserWishToPlayBoardGames);

    /**
     * @api {get} /user/current/friends Get current user friends
     * @apiName GetCurrentUserFriends
     * @apiGroup User friends
     * @apiDescription Get current user friends
     * @apiUse TokenHeaderRequired
     * @apiUse UserListDescriptor
     */
    app.route("/user/current/friends")
        .get(UserController.getCurrentUserFriends);

    // TODO should return shallow user data
    /**
     * @api {get} /user/current/friends Get current user friends
     * @apiName GetUserFriends
     * @apiGroup User friends
     * @apiDescription Get user friends
     * @apiParam {Number} id User identifier.
     * @apiUse TokenHeaderRequired
     * @apiUse UserListDescriptor
     */
    app.route("/user/:uid/friends")
        .get(user_access.read, UserController.getUserFriends);

    /**
     * @api {get} /user/current/event_invites Get current user event invites
     * @apiName GetCurrentUserEventInvites
     * @apiGroup Event invites
     * @apiDescription Get event invites sent to the current user
     * @apiParam (query) {String[]} [status] If set: filter invites based on the given statuses.
     * @apiUse TokenHeaderRequired
     * @apiUse EventInviteListDescriptor
     */
    app.route("/user/current/event_invites")
        .get(EventJoinController.getCurrentUserEventInvites);

    // Friendships
    /**
     * @api {get} /friend_requests Get friend requests
     * @apiName GetFriendRequests
     * @apiGroup User friends
     * @apiDescription Get current user friend requests
     * @apiUse TokenHeaderRequired
     * @apiUse FriendRequestListDescriptor
     */
    app.route("/friend_requests")
        .get(UserController.getFriendshipRequests);

    /**
     * @api {post} /friend_requests Send friend request
     * @apiName SendFriendRequest
     * @apiGroup User friends
     * @apiDescription Send a friend request from the current to the specified user
     * @apiParam (body) {Number} id_recipient Friend request recipient user identifier.
     * @apiUse TokenHeaderRequired
     * @apiUse FriendRequestDescriptor
     */

    /**
     * @api {put} /friend_requests Handle friend request
     * @apiName HandleFriendRequest
     * @apiGroup User friends
     * @apiDescription Handler (i.e. accept or reject) a friend request
     * @apiParam (body) {Number} id_sender User identifier of the sender of the friend.
     * @apiParam (body) {Boolean} accept True for accepting the request, false for rejecting it.
     * @apiUse TokenHeaderRequired
     * @apiUse FriendRequestDescriptor
     */
    app.route("/friend_request")
        .post(
            [body('id_recipient').isInt()],
            validation.validateOrBlock("cannot add friend request"),
            UserController.sendFriendshipRequest
        )
        .put(
            [ body('id_sender').isInt(), body('accept').isBoolean().toBoolean() ],
            validation.validateOrBlock("cannot handle friend request"),
            UserController.handleFriendshipRequest
        );


    // Event
    const event_access = {
        read: access_checks.get_event_access_callback(access_checks.ACCESS_READ),
        write: access_checks.get_event_access_callback(access_checks.ACCESS_WRITE),
        admin: access_checks.get_event_access_callback(access_checks.ACCESS_ADMIN),
        list: access_checks.get_event_access_callback(access_checks.ACCESS_LIST)
    };

    /**
     * @api {post} /event Create event
     * @apiName CreateEvent
     * @apiGroup Event
     * @apiDescription Create an event.
     * @apiParam (body) {String} name Event name
     * @apiParam (body) {String} start Start datetime (ISO8601)
     * @apiParam (body) {String} end End datetime (ISO8601)
     * @apiParam (body) {String} description Event description
     * @apiParam (body) {Boolean} hide_rankings True if rankings should be hidden, false otherwise
     * @apiUse TokenHeaderRequired
     * @apiUse EventDescriptor
     * @apiUse DBDatetimeFields
     * @apiUse ErrorDescriptor
     */
    app.route("/event")
        .post(
            validation.getEventValidators(true),
            validation.validateOrBlock('cannot create event'),
            EventController.createEvent
        );

    /**
     * @api {get} /event/:id Get event
     * @apiName GetEvent
     * @apiGroup Event
     * @apiDescription Get the specified event data.
     *
     * @apiParam {Number} id The event identifier
     *
     * @apiUse TokenHeaderRequired
     * @apiUse FullEventDescriptor
     * @apiUse DBDatetimeFields
     */

    /**
     * @api {delete} /event/:id Delete event
     * @apiName DeleteEvent
     * @apiGroup Event
     * @apiDescription Delete the event.
     * Note: only the creator can use this endpoint.
     *
     * @apiParam {Number} id The event identifier
     *
     * @apiUse TokenHeaderRequired
     * @apiUse SuccessObjDescriptor
     */

    /**
     * @api {post} /event/:id Update event
     * @apiName UpdateEvent
     * @apiGroup Event
     * @apiDescription Update an event.
     * Note: only the creator can use this endpoint.
     *
     * @apiParam (body) {String} name Event name
     * @apiParam (body) {String} start Start datetime (ISO8601)
     * @apiParam (body) {String} end End datetime (ISO8601)
     * @apiParam (body) {String} description Event description
     * @apiParam (body) {Boolean} hide_rankings True if rankings should be hidden, false otherwise
     * @apiUse TokenHeaderRequired
     * @apiUse EventDescriptor
     * @apiUse DBDatetimeFields
     * @apiUse ErrorDescriptor
     */
    app.route("/event/:eid")
        .get(event_access.read, EventController.getFullEvent)
        .delete(event_access.admin, EventController.deleteEvent)   // only creator
        .put(event_access.admin, validation.getEventValidators(false), validation.validateOrBlock('cannot update event'), EventController.updateEvent);

    /**
     * @api {get} /events Get events
     * @apiName GetEvents
     * @apiGroup Event
     * @apiDescription Get all the events the current user has `list` access to.
     *
     * @apiParam (query) {Boolean} [ongoing] If set, filters the events: true for fetching ongoing events only,
     * false for the other events.
     * @apiParam (query) {Boolean} [registered] If set, filters the events: true for fetching
     * only the events he is an attendee of, false for the other events.
     * @apiParam (query) {String[]} [visibility] If set, filters the events: only event having the given visibilities
     *
     * @apiUse TokenHeaderRequired
     * @apiUse EventListDescriptor
     */
    app.route("/events")
        .get([
            query('ongoing').optional().isBoolean().toBoolean(),
            query('registered').optional().isBoolean().toBoolean(),
            query('visibility').optional().isArray().not().isEmpty().custom(validation.valuesIn([
                db.Event.VISIBILITY_PUBLIC, db.Event.VISIBILITY_PRIVATE, db.Event.VISIBILITY_SECRET
            ])),
        ], validation.validateOrBlock("cannot list events"), EventController.getCurrentUserEvents);

    /**
     * @api {get} /event/:eid/stats Get event statistics
     * @apiName GetEventStatistics
     * @apiGroup Event
     * @apiDescription Get the event statistics.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     * @apiSuccess {Number} games_played Number of games played
     * @apiSuccess {Number} board_games_played Number of distinct board games played
     * @apiSuccess {Number} minutes_played Number of minutes played
     * @apiSuccess {Number} provided_board_games Number of brought distinct board games
     * @apiSuccess {Game} longest_game Longest game
     * @apiSuccess {Object} most_played Most played board game
     * @apiSuccess {BoardGame} most_played.board_game Most played board game (see "Add board game" request for structure).
     * @apiSuccess {Number} most_played.count Number of times played
     */
    app.route("/event/:eid/stats")
        .get(event_access.read, EventController.getEventStats);

    /**
     * @api {get} /event/:eid/activities Get event activities
     * @apiName GetEventActivities
     * @apiGroup Event
     * @apiDescription Get the recent event activities.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiSuccess {Activity[]} activities List of activities. Note: the returned data is a list (not an actual object).
     * @apiSuccess {String} activities.type Type of activities among: `{'event/user_join', 'event/play_game', 'event/add_game'}`.
     * @apiSuccess {String} activities.datetime When the activity occurred (iso8601, UTC)
     * @apiSuccess {BoardGame} activities.board_game (only for `event/add_game` activities) Board game data (see
     * "Add board game" request for structure).
     * @apiSuccess {Game} activities.game (only for `event/play_game` activities) Game data (see "Add event game" for
     * Game structure)
     * @apiSuccess {User} activities.user (only for `event/user_join` and `event/add_game` activity) Event data (see
     * 'Get current user' request for user structure).
     */
    app.route("/event/:eid/activities")
        .get(event_access.read, EventController.getEventActivities);

    /**
     * @api {post} /event/:eid/board_game/:source/:id Add to event from source
     * @apiName AddBoardGameFromSourceToEvent
     * @apiGroup Event board game
     * @apiDescription Add a new board game from the given source to the application, then add this game to the
     * specified event.
     * Note: only the creator or an attendee can use this endpoint.
     * @apiUse SourceParameter
     * @apiParam {Number} eid Event identifier.
     * @apiUse TokenHeaderRequired
     * @apiUse ProvidedBoardGamesListDescriptor
     */
    app.route("/event/:eid/board_game/:source/:id")
        .post(event_access.write, EventController.addBoardGameAndAddToEvent);

    /**
     * @api {get} /event/:id/board_games Get provided board games
     * @apiName GetProvidedBoardGames
     * @apiGroup Event board game
     * @apiDescription Get all the board games brought by the current user to the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse ProvidedBoardGamesListDescriptor
     */

    /**
     * @api {post} /event/:id/board_games Add provided board games
     * @apiName AddProvidedBoardGames
     * @apiGroup Event board game
     * @apiDescription Add all the given board games to the the current user's 'provided' list of the specified event.
     * Note: only the creator or an attendee can use this endpoint.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse ProvidedBoardGamesListDescriptor
     */

    /**
     * @api {delete} /event/:id/board_games Delete provided board games
     * @apiName DeleteProvidedBoardGames
     * @apiGroup Event board game
     * @apiDescription Remove all the given board games to the the current user's 'provided' list of the specified event.
     * Note: only the creator or an attendee can use this endpoint.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse SuccessObjDescriptor
     */
    app.route("/event/:eid/board_games")
        .get(event_access.read, EventController.getProvidedBoardGames)
        .post(event_access.write, EventController.addProvidedBoardGames)
        .delete(event_access.write, EventController.deleteProvidedBoardGames);

    /**
     * @api {post} /event/:id/game Add event game
     * @apiName AddEventGame
     * @apiGroup Event game
     * @apiDescription Add a game at the specified event.
     * Note: only the creator or an attendee can use this endpoint.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiParam (body) {Number} id_board_game Board game identifier
     * @apiParam (body) {Number} [duration] Duration of the board game, or `null`.
     * @apiParam (body) {String} ranking_method The ranking method for the game. One of: `{WIN_LOSE, POINTS_LOWER_BETTER, POINTS_HIGHER_BETTER}`.
     * @apiPAram (body) {Number} [id_timer] Add a timer identifier
     * @apiParam (body) {GamePlayer[]} players List of players involved with the game.
     * @apiParam (body) {Number} players.score Player score
     * @apiParam (body) {String} players.name Player name if not registered on the platform (mutually exclusive with
     * 'user') or `null`.
     * @apiParam (body) {Number} players.id_user Player user identifier (mutually exclusive with 'name') or `null`.
     * @apiUse TokenHeaderRequired
     *
     * @apiUse FullGameDescriptor
     * @apiUse DBDatetimeFields
     */
    app.route("/event/:eid/game")
        .post(
            event_access.write,
            validation.getGameValidators(true).concat([
                validation.modelExists(check('eid'), db.Event)
            ]),
            validation.validateOrBlock('cannot add game to the event'),
            GameController.addEventGame
        );

    /**
     * @api {put} /event/:eid/game/:gid Update event game
     * @apiName UpdateEventGame
     * @apiGroup Event game
     * @apiDescription Update a game of the specified event. If a list of players is provided, it replaces the old list of players completely .
     * Note: only the creator or an attendee can use this endpoint.
     *
     * @apiParam {Number} eid Event identifier.
     * @apiParam {Number} gid Game identifier.
     *
     * @apiParam (body) {Number} id_board_game (Optional) Board game identifier
     * @apiParam (body) {Number} duration (Optional) Duration of the board game, or `null`.
     * @apiParam (body) {String} ranking_method (Optional) The ranking method for the game. One of: `{WIN_LOSE, POINTS_LOWER_BETTER, POINTS_HIGHER_BETTER}`.
     * @apiParam (body) {GamePlayer[]} players (Optional) List of players involved with the game. If the list is empty
     * or missing, the list of players (and their scores) is not updated.
     * @apiParam (body) {Number} players.score Player score
     * @apiParam (body) {String} players.name Player name if not registered on the platform (mutually exclusive with
     * 'user') or `null`.
     * @apiParam (body) {Number} players.id_user Player user identifier (mutually exclusive with 'name') or `null`.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse FullGameDescriptor
     * @apiUse DBDatetimeFields
     */
    app.route("/event/:eid/game/:gid")
        .put(
            event_access.write,
            validation.getGameValidators(false).concat([
                validation.modelExists(check('eid'), db.Event),
                validation.modelExists(check('gid'), db.Game)
            ]), validation.validateOrBlock('cannot update event game'),
            GameController.updateEventGame
        );

    /**
     * @api {get} /event/:id/games Get event games
     * @apiName GetEventGames
     * @apiGroup Event game
     * @apiDescription Get all the games played at the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse PaginationParameters
     *
     * @apiSuccess {Game[]} games List of the games of the event (see "Add event game" for Game structure). Note: the
     * returned data is a list (not an actual object).
     */
    app.route("/event/:eid/games")
        .get(event_access.read, GameController.getEventGames);

    /**
     * @api {get} /event/:id/games/latest Get recent event game
     * @apiName GetRecentEventGame
     * @apiGroup Event game
     * @apiDescription Get the most recent games of the specified event.
     *
     * @apiParam {Number} id Event identifier.
     * @apiParam (query) {Number} count The number of games to return.
     *
     * @apiUse TokenHeaderRequired
     *
     * @apiSuccess {Game[]} games List of the games of the event (see "Add event game" for Game structure). Note: the
     * returned data is a list (not an actual object).
     */
    app.route("/event/:eid/games/latest")
        .get(event_access.read, GameController.getRecentEventGames);

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
    app.route("/event/:eid/attendees")
        .get(event_access.read, EventController.getEventAttendees);

    /**
     * @api {delete} /event/:id/attendee/:uid Delete event attendee
     * @apiName DeleteEventAttendee
     * @apiGroup Event attendee
     * @apiDescription Remove an attendee from the specified event.
     * Note: only the creator can use this endpoint
     *
     * @apiParam {Number} eid Event identifier.
     * @apiParam {Number} uid Attendee user identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/attendee/:uid")
        .delete(
            event_access.admin,
            EventJoinController.deleteEventAttendee
        );

    /**
     * @api {post} /event/:id/join Join event
     * @apiName JoinEvent
     * @apiGroup Event
     * @apiDescription Subscribe the current user to the event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse SuccessObjDescriptor
     */
    app.route("/event/:eid/join")
        .post(
            [param('eid').custom(validation.model(db.Event))],
            validation.validateOrBlock("event not found: cannot join"),
            EventJoinController.joinEvent
        );

    /**
     * @api {get} /event/:id/rankings Get event rankings
     * @apiName GetEventRankings
     * @apiGroup Event
     * @apiDescription Get all the rankings for the specified event.
     *
     * @apiParam {Number} id Event identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/rankings")
        .get(event_access.read, StatsController.getEventRankings);

    /**
     * @api {get} /event/:id/ranking/:type Get event ranking
     * @apiName GetEventRanking
     * @apiGroup Event
     * @apiDescription Get one ranking for the specified event.
     *
     * @apiParam {Number} id Event identifier.
     * @apiParam {String} type Name of the ranking to fetch. One of: `{'victory_count', 'defeat_count', 'victory_prop',
     * 'defeat_prop', 'count_games', 'count_unique_games', 'is_last', 'is_last_prop', 'gcbgb'}`
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/event/:eid/ranking/:type(" + StatsController.availableRankings.join("|") + ")")
        .get(event_access.read, StatsController.getEventRanking);


    /**
     * @api {get} /event/:id/matchmaking Get event matchmaking
     * @apiName GetEventMatchmaking
     * @apiGroup Event
     * @apiDescription Get the current user matchmaking recommendations at the given event. List board games that were
     * brought to the event and that the current user and other players have marked in their wish to play list.
     * @apiParam {Number} id Event identifier.
     * @apiSuccess {Match[]} matchmaking List of possible playable games
     * @apiSuccess {BoardGame} matchmaking.board_game The board game the current player wishes to play to
     * @apiSuccess {User[]} matchmaking.users List of other users wishing to play the board game
     */
    app.route("/event/:eid/matchmaking")
        .get(event_access.read, EventController.getEventMatchmaking);

    /**
     * @api {get} /event/:id/wish_to_play Get event wish to play
     * @apiName GetEventWishToPlay
     * @apiGroup Event
     * @apiDescription Get the board games that the event attendees have added to their wish to play list
     * @apiParam {Number} id Event identifier.
     * @apiParam (query) {Boolean} [exclude_current=false] True for not counting current user wish to play list, false
     * otherwise.
     * @apiParam (query) {Boolean} [provided_games_only=false] True for only including board games that are provided at
     * the event
     * @apiSuccess {WishedBoardGames[]} wished List of wished board games. Note: the returned data is a list (not
     * an actual object).
     * @apiSuccess {Number} wished.id_board_game Board game identifier
     * @apiSuccess {Number} wished.count Number of people who have added this board game to their wish to play list
     * @apiSuccess {BoardGame} wished.board_game Board game data (see "Add board game" request for structure)
     */
    app.route("/event/:eid/wish_to_play")
        .get(event_access.read, [
            query('exclude_current').optional().isBoolean().toBoolean(),
            query('provided_games_only').optional().isBoolean().toBoolean()
        ], validation.validateOrBlock('cannot get user wish to play list'), EventController.getEventWishToPlayGames);

    /**
     * @api {get} /event/:eid/timers Get current user event timers
     * @apiName GetCurrentUserEventTimers
     * @apiGroup Timer
     * @apiDescription Get all the timers the current user is involved in at the given event.
     * @apiParam {Number} id Event identifier.
     * @apiUse TokenHeaderRequired
     * @apiUse TimerListDescriptor
     */
    app.route("/event/:eid/timers")
        .get(event_access.read, TimerController.getCurrentUserEventTimers);

    /**
     * @api {post} /timer Create event timer
     * @apiName CreateEventTimer
     * @apiGroup Event
     * @apiDescription Create a new timer associated to an event. Must be either the creator of the event or an attendee.
     * @apiParam (param) {Number} id_event Event identifier.
     * @apiParam (body) {String} timer_type=`COUNT_UP` The type of timer to create. One of: `COUNT_UP`, `COUNT_DOWN `or `RELOAD`.
     * @apiParam (body) {Number} [id_board_game=null] Board game identifier
     * @apiParam (body) {Number} [initial_duration=0] Start time of all players' timers in milliseconds.
     * @apiParam (body) {Number} [current_player=0] Turn order of the current player (an integer in `[0, n_players[`)
     * @apiParam (body) {Number} [reload_increment=0] If the timer is of type `RELOAD`, the amount of time add every at every `next()` action.
     * @apiParam (body) {PlayerTimer[]} player_timers Individual player timers information.
     * @apiParam (body) {Number} player_timers.id_user Player user identifier if registered on the app (mutually exclusive with `name`), or `null`.
     * @apiParam (body) {String} player_timers.name Player name if the player is not registered on the application (mutually
     * exclusive with `user`), or `null`.
     * @apiParam (body) {Number} player_timers.color=#ffffff Player's color (hexcode, e.g.: `#ffffff`).
     * @apiUse TokenHeaderRequired
     * @apiUse TimerDescriptor
     */
    app.route("/event/:eid/timer")
        .post(
            event_access.write,
            validation.getTimerValidators(true),
            validation.validateOrBlock('cannot create event timer'),
            TimerController.createTimer
        );

    /**
     * @api {get} /event/:eid/invites List event invites
     * @apiName ListEventInvites
     * @apiGroup Event invites
     * @apiDescription List invites associated with the given event.
     *
     * @apiParam (query) {String[]} [status] If set: filter invites based on the given statuses.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse EventInviteListDescriptor
     */
    app.route("/event/:eid/invites")
        .get(
            event_access.write, [  // write access because only create or attendees can access
                param('eid').custom(validation.model(db.Event)),
                query('status').optional().isArray().not().isEmpty().custom(validation.valuesIn(db.EventInvite.STATUSES))
            ], validation.validateOrBlock("cannot list event invites"),
            EventJoinController.listEventInvites
        );

    /**
     * @api {post} /event/:eid/invite Send event invite
     * @apiName SendEventInvite
     * @apiGroup Event invites
     * @apiDescription Send an event invite to a user (from the current user)
     *
     * @apiParam (param) {Number} eid Event identifier
     * @apiParam (body) {Number} id_invitee Invite recipient user identifier
     *
     * @apiUse TokenHeaderRequired
     * @apiUse EventInviteDescriptor
     */

    /**
     * @api {put} /event/:eid/invite  Handle event invite
     * @apiName HandleEventInvite
     * @apiGroup Event invites
     * @apiDescription Handle an event invite (sent to the current user)
     *
     * @apiParam (param) {Number} eid Event identifier
     * @apiParam (body) {Boolean} accept True for accepting the request, false for rejecting it
     *
     * @apiUse TokenHeaderRequired
     * @apiUse EventInviteDescriptor
     */
    app.route("/event/:eid/invite")
        .post(
            event_access.write, [
                body('id_invitee').custom(validation.model(db.User)),
                param('eid').custom(validation.model(db.Event))
            ], validation.validateOrBlock("cannot send event invite"),
            EventJoinController.sendEventInvite
        )
        .put(
            [
                body('accept').isBoolean().toBoolean(),
                param('eid').custom(validation.model(db.Event))
            ], validation.validateOrBlock("cannot handle event invite"),
            EventJoinController.handleEventInvite
        );


    /**
     * @api {get} /event/:eid/join_requests List event join requests
     * @apiName ListEventJoinRequests
     * @apiGroup Event join request
     * @apiDescription List join requests associated with the given event.
     *
     * @apiParam (query) {String[]} [status] If set: filter join requests based on the given statuses.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse EventJoinRequestsListDescriptor
     */
    app.route('/event/:eid/join_requests')
        .get(
            event_access.write, [  // write access because only create or attendees can access
                param('eid').custom(validation.model(db.Event)),
                query('status').optional().isArray().not().isEmpty().custom(validation.valuesIn(db.EventInvite.STATUSES))
            ], validation.validateOrBlock("cannot list event join requests"),
            EventJoinController.listJoinRequests
        );

    /**
     * @api {post} /event/:eid/join_request Send event join request
     * @apiName SendEventJoinRequest
     * @apiGroup Event join request
     * @apiDescription Send a join request for an event.
     *
     * @apiParam (param) {Number} eid Event identifier
     *
     * @apiUse TokenHeaderRequired
     * @apiUse EventJoinRequestDescriptor
     */

    /**
     * @api {put} /event/:eid/join_request Handle event join request
     * @apiName HandleEventJoinRequest
     * @apiGroup Event join request
     * @apiDescription Handle a join request for the given event.
     *
     * @apiParam (param) {Number} eid Event identifier
     * @apiParam (body) {Number} id_requester Invite recipient user identifier
     * @apiParam (body) {Boolean} accept True for accepting the request, false for refusing it.
     *
     * @apiUse TokenHeaderRequired
     * @apiUse EventJoinRequestDescriptor
     */
    app.route('/event/:eid/join_request')
        .post(
            [
                param('eid').custom(validation.model(db.Event))
            ], validation.validateOrBlock("cannot add join request"),
            EventJoinController.sendJoinRequest
        ).put(
            event_access.write, [
                body('id_requester').isNumeric().toInt(),
                body('accept').isBoolean().toBoolean(),
                param('eid').isNumeric().toInt()
            ], validation.validateOrBlock("cannot handle join request"),
            EventJoinController.handleJoinRequest
        );

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
     *
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
     * @apiUse BoardGameDescriptor
     * @apiUse DBDatetimeFields
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
     * @apiUse BoardGameDescriptor
     * @apiUse DBDatetimeFields
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
     * @apiUse BoardGameDescriptor
     * @apiUse DBDatetimeFields
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
     * @apiUse SuccessObjDescriptor
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
     * @apiParam {Number} id Game identifier.
     *
     * @apiUse TokenHeaderRequired
     */
    app.route("/game/:gid")
        .get(GameController.getGame)
        .delete(GameController.deleteGame);

    // timer api
    /**
     * @api {post} /timer Create timer
     * @apiName CreateTimer
     * @apiGroup Timer
     * @apiDescription Create a new timer.
     * @apiParam (body) {String} timer_type=`COUNT_UP` The type of timer to create. One of: `COUNT_UP`, `COUNT_DOWN `or `RELOAD`.
     * @apiParam (body) {Number} [id_board_game=null] Board game identifier
     * @apiParam (body) {Number} [id_event=null] Event identifier
     * @apiParam (body) {Number} [initial_duration=0] Start time of all players' timers in milliseconds.
     * @apiParam (body) {Number} [current_player=0] Turn order of the current player (an integer in `[0, n_players[`)
     * @apiParam (body) {Number} [reload_increment=0] If the timer is of type `RELOAD`, the amount of time add every at every `next()` action.
     * @apiParam (body) {PlayerTimer[]} player_timers Individual player timers information.
     * @apiParam (body) {Number} player_timers.id_user Player user identifier if registered on the app (mutually exclusive with `name`), or `null`.
     * @apiParam (body) {String} player_timers.name Player name if the player is not registered on the application (mutually
     * exclusive with `user`), or `null`.
     * @apiParam (body) {Number} player_timers.color=#ffffff Player's color (hexcode, e.g.: `#ffffff`).
     * @apiUse TokenHeaderRequired
     * @apiUse TimerDescriptor
     */
    app.route("/timer")
        .post(validation.getTimerValidators(true), TimerController.createTimer);

    /**
     * @api {post} /timer/:tid Get timer
     * @apiName GetTimer
     * @apiGroup Timer
     * @apiDescription Get timer data (only peek at one point in time. For real-time refresh, use the socket timer api).
     * @apiUse TokenHeaderRequired
     * @apiUse TimerDescriptor
     */
    app.route("/timer/:tid")
        .get(TimerController.getTimer);

    /**
     * @api {get} /timers Get current user timers
     * @apiName GetCurrentUserTimers
     * @apiGroup Timer
     * @apiDescription Get all the timers the current user is involved in.
     * @apiUse TokenHeaderRequired
     * @apiUse TimerListDescriptor
     */
    app.route("/timers")
        .get(TimerController.getCurrentUserTimers);

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