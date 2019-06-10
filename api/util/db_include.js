const db = require("../models/index");

/**
 * List of excluded attributes in the user model. Those should not be returned by the API.
 * @type {string[]}
 */
exports.userExcludedAttributes = ["password", "validated"];
exports.userShallowAttributes = ["name", "surname", "username", "id"];

/**
 *
 * @param model Sequelize model to be included
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}} And possibly a include field
 */
exports.genericIncludeSQ = function(model, as, includes) {
    if (!includes) {
        return {model: model, as: as}
    } else {
        return {model: model, as: as, include: includes}
    }
};

/**
 * Generates an include object for events
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}}
 */
exports.getEventIncludeSQ = function(as, includes) {
    return exports.genericIncludeSQ(db.Event, as, includes);
};

/**
 * Generates an include object for board games
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}}
 */
exports.getBoardGameIncludeSQ = function(as, includes) {
    return exports.genericIncludeSQ(db.BoardGame, as, includes);
};

/**
 * Generates an include object for users
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *, attributes: {exclude: string[]}}}
 */
exports.getUserIncludeSQ = function(as, includes) {
    let base_include = exports.genericIncludeSQ(db.User, as, includes);
    return Object.assign({attributes: {exclude: exports.userExcludedAttributes}}, base_include);
};

/**
 * Generates an include object for users
 * @param as Name of the inclusion
 * @returns {{model: *, as: *, attributes: string[]}}
 */
exports.getShallowUserIncludeSQ = function(as) {
    let base_include = exports.genericIncludeSQ(db.User, as);
    return Object.assign({attributes: exports.userShallowAttributes}, base_include);
};

/**
 * Generates an include object for games
 * @param as Name of the inclusion
 * @param includes Deeper inclusion (can be undefined if there is none)
 * @returns {{model: *, as: *}}
 */
exports.getGameIncludeSQ = function(as, includes) {
    return exports.genericIncludeSQ(db.Game, as, includes);
};


/**
 * Default include for event as 'event'
 * @type {{model: *, as: "event"}}
 */
exports.defaultEventIncludeSQ = exports.getEventIncludeSQ("event");

/**
 * Default include for user as 'user' (with excluded fields).
 * @type {{model: *, as: "user", attributes: {exclude: string[]}}}
 */
exports.defaultUserIncludeSQ = exports.getUserIncludeSQ("user");

/**
 * Default include for board_game as 'board_game'.
 * @type {{model: *, as: "board_game"}}
 */
exports.defaultBoardGameIncludeSQ = exports.getBoardGameIncludeSQ("board_game");

/**
 * Default include for game as 'game'
 * @type {{model: *, as: "game"}}
 */
exports.defaultGameIncludeSQ = exports.getGameIncludeSQ("game");