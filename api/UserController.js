const config = require("./config/config.js");
const db = require("./models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const util = require("./util/util");
const userutil = require("./util/user");
const includes = require("./util/db_include");
const BoardGameController = require("./BoardGameController");
const Sequelize = require("sequelize");

/**
 *
 * @type {string}
 */
exports.notValidatedErrorMsg = 'An admin must accept your registration request before you can connect to the app.';

/**
 * Remove hashed password from user object
 * @param user
 * @returns User
 */
exports.removeSensitive = function(user) {
    const attributes = includes.userExcludedAttributes;
    for(var i = 0; i < attributes.length; ++i) {
        user[attributes[i]] = undefined;
    }
    return user;
};

const handleUserResponse = function(res, promise) {
    return util.sendModelOrError(res, promise, user => exports.removeSensitive(user));
};

exports.signIn = function(req, res) {
    return db.User.findOne({
        where: {username: {[Sequelize.Op.iLike]: "%" + req.body.username + "%"}}
    }).then(user => {
        if (!user) {
            return util.detailErrorResponse(res, 401, 'Authentication failed. User not found.');
        } else {
            let token_payload = {
                id: user.id,
                email: user.email,
                username: user.username,
                surname: user.surname,
                name: user.name
            };
            return user.validPassword(req.body.password).then(
                password_ok => {
                    if (!password_ok) {
                        return util.detailErrorResponse(res, 401, 'Authentication failed. User not found.');
                    } else if (!user.validated) {
                        return util.detailErrorResponse(res, 403, exports.notValidatedErrorMsg);
                    } else {
                        return util.successResponse(res, {
                            token: jwt.sign(token_payload, config.jwt_secret_key, {expiresIn: config.jwt_duration}) // 4 days
                        });
                    }
                }
            )
        }
    })
};

exports.register = function(req, res) {
    return bcrypt.hash(req.body.password, 10, function(err, hash) {
        return db.User.create({
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            password: hash,
            username: req.body.username,
            admin: false,  // by default not admin
            validated: null    // by default not accepted nor refused
        }).then((user) => {
            return util.successResponse(res, exports.removeSensitive(user));
        })
        .catch((err) => {
            return util.detailErrorResponse(res, 403, "username or email exists");
        });
    });
};

exports.getCurrentUser = function(req, res) {
    let userId = userutil.getCurrUserId(req);
    return handleUserResponse(res, db.User.findById(userId));
};


exports.updateUser = function(req, res) {
    // TODO security: implement token invalidation check when password changes
    let userId = userutil.getCurrUserId(req);
    if(userId !== req.params.uid) { // TODO: allow update of another user for admins?
        return util.detailErrorResponse(res, 404, "cannot update data of another user");
    }

    return db.User.findById(userId)
        .then(user => {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.name = req.body.name || user.name;
            user.surname = req.body.surname || user.surname;
            if (req.body.password) {
                return bcrypt.hash(req.body.password, 10, function(err, hash) {
                    user.password = hash;
                    return handleUserResponse(res, user.save());
                })
            } else {
                return handleUserResponse(res, user.save());
            }
        })
        .catch(err => {
            return util.detailErrorResponse(res, 404, "user not found");
        })
};

/**
 * Send the list of games in the library of the currently connected user in the response (or a 500 error)
 * @returns {Promise<Array<Model>>}
 */
exports.sendCurrUserGames = function(req, res) {
    return exports.sendUserLibraryGames(userutil.getCurrUserId(req), req, res);
};

/**
 * Send the current list of games in the library of a given user in the response (or a 500 error)
 * @returns {Promise<Array<Model>>}
 */
exports.sendUserLibraryGames = function(uid, req, res) {
    return util.sendModelOrError(res, db.LibraryGame.findAll({
        where: {id_user: uid},
        include: [includes.defaultBoardGameIncludeSQ]
    }));
};

exports.addLibraryGames = function(req, res) {
    if (!req.body.games) {
        return res.status(403).send({error: "missing games field"});
    }
    let userId = userutil.getCurrUserId(req);
    let games = req.body.games.map(g => { return { id_user: userId, id_board_game: g }});
    return db.LibraryGame.bulkCreate(games, { ignoreDuplicates: true })
        .then(() => { return exports.sendCurrUserGames(req, res); })
        .catch(err => { return util.errorResponse(res); });
};

exports.deleteLibraryGames = function(req, res) {
    if (!req.body.games) {
        return util.detailErrorResponse(res, 403, "missing games field");
    }
    let userId = userutil.getCurrUserId(req);
    return db.LibraryGame.destroy({
        where: {
            id_user: userId,
            id_board_game: req.body.games
        }
    }).then(() => { return exports.sendCurrUserGames(req, res); })
      .catch(err => { return util.errorResponse(res); });
};

exports.getCurrentUserLibraryGames = function(req, res) {
    return exports.sendCurrUserGames(req, res);
};

exports.getUserLibraryGames = function(req, res) {
    return exports.sendUserLibraryGames(req.params.uid, req, res);
};

exports.addBoardGameAndAddToLibrary = function(req, res) {
    const createFn = (board_game, req, res) => {
        return db.LibraryGame.create({
            id_user: userutil.getCurrUserId(req),
            id_board_game: board_game.id
        }, {ignoreDuplicates: true}).then(l => {
            return exports.sendCurrUserGames(req, res);
        }).catch(err => {
            return util.errorResponse(res);
        });
    };
    const bggId = parseInt(req.params.id);
    const source = req.params.source;
    return BoardGameController.executeIfBoardGameExists(bggId, source, req, res, createFn);
};
