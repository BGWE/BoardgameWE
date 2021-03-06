
/**
 * @apiDefine TokenHeaderRequired
 *
 * @apiHeader {String} Authentication User authentication token `JWT {token}`
 */

/**
 * @apiDefine SourceParameter
 *
 * @apiParam {String} source The source identifier. Currently, only supports 'bgg'.
 * @apiParam {Number} id Board game identifier on the source platform.
 */

/**
 * @apiDefine DBDatetimeFields
 * @apiSuccess {String} createdAt Creation datetime of the resource (ISO8601, UTC)
 * @apiSuccess {String} updatedAt Latest update datetime of the resource (ISO8061, UTC)
 */

/**
 * @apiDefine UserDescriptor
 *
 * @apiSuccess {Number} id User id
 * @apiSuccess {String} name User name
 * @apiSuccess {String} surname User surname
 * @apiSuccess {String} username User username
 * @apiSuccess {Boolean} admin True if the user is an admin, false otherwise
 * @apiSuccess {String} email User email
 */

/**
 * @apiDefine ShallowUserDescriptor
 *
 * @apiSuccess {Number} id User id
 * @apiSuccess {String} name User name
 * @apiSuccess {String} surname User surname
 * @apiSuccess {String} username User username
 */

/**
 * @apiDefine UserCurrentFriendshipDescriptor
 *
 * @apiSuccess {Object} current Information about relation between the specified and current users
 * @apiSuccess {Boolean} current.is_current True if the user is the current user
 * @apiSuccess {Boolean} current.is_friend True if the user is a friend of the current user
 * @apiSuccess {Boolean} current.has_sent_friendship_request True if the current user has sent a pending friendship request to the specified user
 * @apiSuccess {Boolean} current.has_received_friendship_request True if the current user has received a pending friendship request from the specified user
 */



/**
 * @apiDefine UserListDescriptor
 * @apiSuccess {User[]} users List of users. See "Get current user" request for user object structure. Note: the
 * returned data is a list (not an actual object).
 */

/**
 * @apiDefine FriendRequestDescriptor
 * @apiSuccess {Number} id_user_from Identifier of the friend request sender
 * @apiSuccess {Number} id_user_to Identifier of the friend request recipient
 * @apiSuccess {String} status Frienship request status. One of: `{ACCEPTED, REJECTED, PENDING}`.
 * @apiSuccess {User} user_to Recipient user data
 */

/**
 * @apiDefine FriendRequestListDescriptor
 * @apiSuccess {FriendshipRequest[]} requests List of friendship requests. See "Send friendship request" request for
 * friendship request object structure. Note: the returned data is a list (not an actual object).
 */

/**
 * @apiDefine EventDescriptor
 *
 * @apiSuccess {Number} id Event identifier
 * @apiSuccess {String} name Event name
 * @apiSuccess {String} start Start date (ISO8601, UTC)
 * @apiSuccess {String} end End date (ISO8601, UTC)
 * @apiSuccess {String} description Event description
 * @apiSuccess {Number} id_creator Event creator user identifier
 * @apiSuccess {ShallowUser} user Event creator data
 * @apiSuccess {Number} user.id Event creator identifier
 * @apiSuccess {String} user.name Event creator name
 * @apiSuccess {String} user.surname Event creator surname
 * @apiSuccess {String} user.username Event creator username
 * @apiSuccess {Boolean} hide_rankings True if rankings should be hidden, false otherwise
 * @apiSuccess {String} visibility Event visibility. One of: `["PUBLIC", "PRIVATE", "SECRET"]`
 * @apiSuccess {Boolean} invite_required True if an invite is required to join the event
 * @apiSuccess {Boolean} attendees_can_edit True if attendees can also edit the event (add game, timer...)
 * @apiSuccess {Boolean} invite_required True if an invite is required to join the event
 * @apiSuccess {Boolean} user_can_join True if a user can join directly, false if he must first send a join request
 * @apiSuccess {Object} current Current user status regarding the event access
 * @apiSuccess {Boolean} current.is_attendee True if the user is an attendee of the event
 * @apiSuccess {Boolean} current.is_invitee True if the user is an invitee of the event (invite request is pending)
 * @apiSuccess {Boolean} current.is_requester True if the user has send a (still pending) join request for this event
 * @apiSuccess {Boolean} current.is_rejected True if a user join request for this event was rejected
 * @apiSuccess {Boolean} current.is_creator True if the user is the creator of the event
 * @apiSuccess {Boolean} current.can_join True if the user can directly join the event (false if user is already an attendee)
 * @apiSuccess {Boolean} current.can_request True if the user can send an join request to the event (false if user is already an attendee, `can_join` should have precedence on this one, as it indicates direct access is possible)
 * @apiSuccess {Boolean} current.can_read True if the user can issue event-related api requests that are not state-changing
 * @apiSuccess {Boolean} current.can_write True if the user can issue event-related api requests that are state-changing
 */

/**
 * @apiDefine EventInviteDescriptor
 * @apiSuccess {Number} id_event Event identifier
 * @apiSuccess {ShallowEvent} event Event data
 * @apiSuccess {ShallowUser} inviter User data of the inviter (see 'Get event' description for `ShallowUser` structure)
 * @apiSuccess {Number} id_inviter User identifier of the inviter
 * @apiSuccess {ShallowUser} invitee User data of the invitee (see 'Get event' description for `ShallowUser` structure)
 * @apiSuccess {Number} id_invitee User identifier of the invitee
 * @apiSuccess {String} status Invite status. One of `['PENDING', 'REJECTED', 'ACCEPTED']`
 */

/**
 * @apiDefine EventInviteListDescriptor
 * @apiSuccess {EventInvite[]} requests List of event invites. See "Send event invite" request for
 * event invite object structure. Note: the returned data is a list (not an actual object).
 */

/**
 * @apiDefine EventJoinRequestsListDescriptor
 * @apiSuccess {JoinRequest[]} requests List of event invites. See "Send event join request" request for
 * event join request object structure. Note: the returned data is a list (not an actual object).
 */

/**
 * @apiDefine EventJoinRequestDescriptor
 * @apiSuccess {Number} id_event Event identifier
 * @apiSuccess {ShallowEvent} event Event data
 * @apiSuccess {Number} id_requester Requester user identifier
 * @apiSuccess {ShallowUser} requester Requester user data
 * @apiSuccess {String} status Join request status
 */

/**
 * @apiDefine FullGameDescriptor
 *
 * @apiSuccess {Number} id Game identifier
 * @apiSuccess {String} started_at Start time of the game (ISO8601, UTC)
 * @apiSuccess {String} duration Game duration, or `null`.
 * @apiSuccess {String} comment Comment related to the game.
 * @apiSuccess {String} id_board_game Played board game identifier
 * @apiSuccess {String} id_event Event identifier, or `null`.
 * @apiSuccess {String} ranking_method The ranking method for the game. One of: `{WIN_LOSE, POINTS_LOWER_BETTER, POINTS_HIGHER_BETTER, RANKING_NO_POINT}`.
 * @apiSuccess {Number} id_timer Timer identifier, or `null`.
 * @apiSuccess {BoardGame} board_game Board game data (see "Add board game" request for structure).
 * @apiSuccess {BoardGame[]} expansions Expansions of the selected board game that were played with the board game.
 * @apiSuccess {Player[]} players List of players involved in the game.
 * @apiSuccess {Number} players.id Game player identifier
 * @apiSuccess {Number} players.score Player score
 * @apiSuccess {Number} players.id_user Player user identifier (mutually exclusive with `name`), or `null`.
 * @apiSuccess {ShallowUser} players.user If `id_user` is not `null`, user data (see 'Get event' request for `ShallowUser`
 * structure)
 * @apiSuccess {String} players.name Player name if the player is not registered on the application (mutually
 * exclusive with `user`), or `null`.
 */

/**
 * @apiDefine FullEventDescriptor
 *
 * @apiSuccess {Number} id Event id
 * @apiSuccess {String} name Event name
 * @apiSuccess {String} start Start datetime (ISO8601, UTC)
 * @apiSuccess {String} end End datetime(ISO8601, UTC)
 * @apiSuccess {String} description Event description
 * @apiSuccess {Boolean} hide_rankings True if rankings should be hidden, false otherwise
 * @apiSuccess {Number} id_creator Event creator user identifier
 * @apiSuccess {String} visibility Event visibility. One of: `["PUBLIC", "PRIVATE", "SECRET"]`
 * @apiSuccess {Boolean} invite_required True if an invite is required to join the event
 * @apiSuccess {Boolean} attendees_can_edit True if attendees can also edit the event (add game, timer...)
 * @apiSuccess {Boolean} invite_required True if an invite is required to join the event
 * @apiSuccess {Boolean} user_can_join True if a user can join directly, false if he must first send a join request
 * @apiSuccess {User} creator Creator user data (see 'Get current user' request for user structure)
 * @apiSuccess {Attendee[]} attendees List of event attendees
 * @apiSuccess {ProvidedBoardGame[]} provided_board_games List of board games provided by attendees to the event.
 * @apiSuccess {Object} current Current user status regarding the event access
 * @apiSuccess {Boolean} current.is_attendee True if the user is an attendee of the event
 * @apiSuccess {Boolean} current.is_invitee True if the user is an invitee of the event (invite request is pending)
 * @apiSuccess {Boolean} current.is_requester True if the user has send a (still pending) join request for this event
 * @apiSuccess {Boolean} current.is_rejected True if a user join request for this event was rejected
 * @apiSuccess {Boolean} current.is_creator True if the user is the creator of the event
 * @apiSuccess {Boolean} current.can_join True if the user can directly join the event (false if user is already an attendee)
 * @apiSuccess {Boolean} current.can_request True if the user can send an join request to the event (false if user is already an attendee, `can_join` should have precedence on this one, as it indicates direct access is possible)
 * @apiSuccess {Boolean} current.can_read True if the user can issue event-related api requests that are not state-changing
 * @apiSuccess {Boolean} current.can_write True if the user can issue event-related api requests that are state-changing
 */

/**
 * @apiDefine BoardGameDescriptor

 * @apiSuccess {Number} id Board game identifier
 * @apiSuccess {String} name Board game name
 * @apiSuccess {Number} bgg_id BGG identifier of the board game
 * @apiSuccess {Number} bgg_score Score of the game on BGG
 * @apiSuccess {String} gameplay_video_url URL of a gameplay/rule video (can be `null`)
 * @apiSuccess {Number} min_players Minimum number of players
 * @apiSuccess {Number} max_players Maximum number of players
 * @apiSuccess {Number} min_playing_time Minimum playing time
 * @apiSuccess {Number} max_playing_time Maximum playing time
 * @apiSuccess {Number} playing_time Board game official playing time
 * @apiSuccess {String} thumbnail URL of the board game thumbnail image
 * @apiSuccess {String} image URL of the board game image
 * @apiSuccess {String} description Description of the board game
 * @apiSuccess {Number} year_published Board game publication year
 * @apiSuccess {String} category Comma-separated list of categories the game belongs to.
 * @apiSuccess {String} mechanic Comma-separated list of mechanics the game belongs to.
 * @apiSuccess {String} family  Comma-separated list of families the game belongs to.
 *
 */

/**
 * @apiDefine EventListDescriptor
 * @apiSuccess {Event[]} events List of events. See "Create event" request for event object structure. Note: the
 * returned data is a list (not an actual object).
 */

/**
 * @apiDefine TimerListDescriptor
 * @apiSuccess {Timer[]} timers List of timers. See "Create timer" request for timer object structure. Note: the
 * returned data is a list (not an actual object).
 */

/**
 * @apiDefine LibraryBoardGamesListDescriptor
 * @apiSuccess {LibraryBoardGame[]} library_board_games List of library board games. Note: the
 * returned data is a list (not an actual object).
 * @apiSuccess {Number} library_board_games.id_user User (the library belongs to) identifier
 * @apiSuccess {Number} library_board_games.id_board_game Library board game identifier.
 * @apiSuccess {BoardGame} library_board_games.board_game Board game data (see "Add board game" request for structure)
 * @apiSuccess {String} library_board_games.createdAt Creation datetime of the resource (ISO8601, UTC)
 * @apiSuccess {String} library_board_games.updatedAt Latest update datetime of the resource (ISO8061, UTC)
 */

/**
 * @apiDefine ProvidedBoardGamesListDescriptor
 * @apiSuccess {ProvidedBoardGame[]} provided_board_games List of provided board games. Note: the
 * returned data is a list (not an actual object).
 * @apiSuccess {Number} provided_board_games.id_user User (who provided the board game at the event) identifier
 * @apiSuccess {Number} provided_board_games.id_event Event (the board game is provided at) identifier.
 * @apiSuccess {Number} provided_board_games.id_board_game Provided board game identifier.
 * @apiSuccess {User} provided_board_games.provider Provider user data (see 'Get current user' request for user structure)
 * @apiSuccess {BoardGame} provided_board_games.board_game Board game data (see "Add board game" request for structure)
 * @apiSuccess {String} provided_board_games.createdAt Creation datetime of the resource (ISO8601, UTC)
 * @apiSuccess {String} provided_board_games.updatedAt Latest update datetime of the resource (ISO8061, UTC)
 */

/**
 * @apiDefine TimerDescriptor
 *
 * @apiSuccess {Number} id Timer identifier
 * @apiSuccess {Number} id_board_game Board game identifier (or null if not linked to a board game)
 * @apiSuccess {BoardGame} board_game Board game data (see 'Get board game' request for board game structure).
 * @apiSuccess {Game} game Associated game (or null if no game was created from the timer)
 * @apiSuccess {Number} id_event Event identifier (or null if not linked to an event)
 * @apiSuccess {Event} event Event data (see 'Get events' request for event structure).
 * @apiSuccess {String} timer_type Type of timer. One of: 'COUNT_UP', 'COUNT_DOWN' or 'RELOAD'
 * @apiSuccess {Number} id_creator Identifier of the user who has created the timer.
 * @apiSuccess {User} creator User data (see 'Get current user' request for user structure)
 * @apiSuccess {Number} initial_duration Number of millisecond that each player's timer should start from.
 * @apiSuccess {PlayerTimer[]} player_timers The individual player timers
 * @apiSuccess {Number} player_timers.id_timer Timer identifier.
 * @apiSuccess {Number} player_timers.id_user Player user identifier (mutually exclusive with `name`), or `null`.
 * @apiSuccess {User} player_timers.user If `id_user` is not `null`, user data (see 'Get current user' request for user
 * structure)
 * @apiSuccess {String} player_timers.name Player name if the player is not registered on the application (mutually
 * exclusive with `user`), or `null`.
 * @apiSuccess {Number} player_timers.color Player's color (hexcode, e.g.: `#ffffff`).
 * @apiSuccess {Number} player_timers.elapsed Number of millisecond elapsed since the beginning of the player's timer.
 * @apiSuccess {Number} player_timers.start Start datetime of the player's timer (iso8601, UTC), or `null` if this timer is not running.
 * @apiSuccess {Boolean} player_timers.running `true` if the player's timer is running, `false` otherwise.
 */

/**
 * @apiDefine WishToPlayBoardGamesListDescriptor
 * @apiSuccess {WishToPlayBoardGame[]} wish_to_play List of wish-to-play board games. Note: the
 * returned data is a list (not an actual object).
 * @apiSuccess {Number} wish_to_play.id_user User (the wish-to-play list belongs to) identifier
 * @apiSuccess {Number} wish_to_play.id_board_game Wish-to-play board game identifier.
 * @apiSuccess {BoardGame} wish_to_play.board_game Board game data (see "Add board game" request for structure)
 * @apiSuccess {String} wish_to_play.createdAt Creation datetime of the resource (ISO8601, UTC)
 * @apiSuccess {String} wish_to_play.updatedAt Latest update datetime of the resource (ISO8061, UTC)
 */

/**
 * @apiDefine AchievementsDescriptor
 * @apiSuccess {Achievement[]} achievements List of achievements
 * @apiSuccess {Object} badges An object mapping badge code with list of sorted badge steps obtained. Each
 * element of the list is a badge.
 */

/**
 * @apiDefine AchievementDescriptor
 * @apiSuccess {String} title Achievement title (localized)
 * @apiSuccess {String} description Achievement description (localized)
 * @apiSuccess {String} code Unique identifier of the achievement
 * @apiSuccess {String} scope Achievement scope code
 * @apiSuccess {String} name Achievement name (not-for-human)
 * @apiSuccess {Boolean} is_badge A field set to false indicating the achievement is not a badge
 */

/**
 * @apiDefine SuccessObjDescriptor
 * @apiSuccess {Boolean} success True if success
 */

/**
 * @apiDefine ErrorDescriptor
 * @apiError {String} message General error message
 * @apiError {Boolean} success `false`, indicate that the request has failed
 * @apiError {Error[]} [errors] List of errors
 * @apiError {String} errors.location Location of the parameter (e.g. `body`)
 * @apiError {String} errors.msg Description for this error
 * @apiError {String} errors.param Name of the erroneous parameter
 */

/**
 * @apiDefine PaginationParameters
 * @apiParam (query) { Number} [max_items] Maximum number of items to return
 * @apiParam (query) {Number} [start] Pagination offset (resources are sorted by decreasing creation time)
 */

/**
 * @apiDefine BoardGameExpansionsFields
 * @apiSuccess {Object} expansions Object mapping board game identifier with board game descriptor for all expansions
 * of the fetched games (recursive, that is expansions of expansions etc, are all listed).
 * @apiSuccess {Object} expansion_tree Each entry maps a board game identifier with a list of identifier
 * corresponding to this board game expansions. Each entry of `expansions` has its counterpart in `expansion_tree`.
 */