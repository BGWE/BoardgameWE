const config = require("./config/config.js");
const db = require("./models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const util = require("./util/util");
const userutil = require("./util/user");
const emailutil = require("./util/email");
const includes = require("./util/db_include");
const BoardGameController = require("./BoardGameController");
const Sequelize = require("sequelize");
const Activity = require("./util/activities");
const m2m = require('./util/m2m_helpers');

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
    for (var i = 0; i < attributes.length; ++i) {
        user[attributes[i]] = undefined;
    }
    return user;
};

const handleUserResponse = function(res, promise) {
    return util.sendModelOrError(res, promise, user => exports.removeSensitive(user));
};

exports.signIn = function(req, res) {
    return db.User.findOne({
        where: { username: {
                [Sequelize.Op.iLike]: "%" + req.body.username + "%" } }
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
                            token: jwt.sign(token_payload, config.jwt_secret_key, { expiresIn: config.jwt_duration }) // 4 days
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
                admin: false, // by default not admin
                validated: null // by default not accepted nor refused
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
    return handleUserResponse(res, db.User.findByPk(userId));
};

exports.getUser = function(req, res) {
    const current_uid = userutil.getCurrUserId(req);
    const uid = parseInt(req.params.uid);
    return util.sendModelOrError(res, db.User.findByPk(uid, {
        attributes: includes.userShallowAttributes,
        include: includes.getFriendshipIncludesSQ(current_uid)
    }), (u) => includes.formatShallowUserWithCurrent(u, current_uid));
};

exports.updateUser = function(req, res) {
    // TODO security: implement token invalidation check when password changes
    let userId = userutil.getCurrUserId(req);
    return db.User.findByPk(userId)
        .then(user => {
            let updateFn = function() {
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
            };

            if (req.body.password !== undefined) {
                user.validPassword(req.body.old_password).then(password_ok => {
                    if (password_ok) {
                        return updateFn();
                    } else {
                        return util.detailErrorResponse(res, 403, "invalid/missing old password");
                    }
                });
            } else {
                return updateFn();
            }
        })
        .catch(err => {
            return util.detailErrorResponse(res, 404, "user not found");
        })
};

exports.forgotPassword = function(req, res) {
    return db.User.findOne({
        where: { email: req.body.email }
    }).then(user => {
        if (!user) {
            return util.detailErrorResponse(res, 404, 'User not found.');
        } else {
            emailutil.sendResetPasswordEmail(
                    user.email,
                    config.email_settings.email_address,
                    config.email_settings.sender_name,
                    user.name,
                    userutil.getResetPasswordFrontendUrl(user.id, user.email, user.password, user.createdAt))
                .then(() => {
                    return util.successResponse(res);
                })
                .catch(err => {
                    return util.detailErrorResponse(res, 500, "failed to send password recovery email");
                });
        }
    });
};

exports.resetPassword = function(req, res) {
    let token = req.body.token;
    let userId = req.body.id;
    let password = req.body.password;

    return db.User.findByPk(userId)
        .then(user => {
            try {
                let payload = userutil.getPayloadFromResetPasswordToken(token, user.password, user.createdAt);
            } catch (error) {
                return util.detailErrorResponse(res, 403, "failed to process the token");
            }

            // Token is ok            
            return bcrypt.hash(password, 10, function(err, hash) {
                user.password = hash;
                return handleUserResponse(res, user.save());
            });
        })
        .catch(err => {
            return util.detailErrorResponse(res, 404, "user not found");
        });
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
    return m2m.sendAssociations(res, {
        model_class: db.LibraryGame,
        fixed: { id: uid, field: 'id_user' },
        other: { includes: [includes.defaultBoardGameIncludeSQ] }
    });
};

exports.addLibraryGames = function(req, res) {
    return m2m.addAssociations(req, res, {
        model_class: db.LibraryGame,
        fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
        other: {
            field: 'id_board_game',
            ids: req.body.board_games,
            includes: [includes.defaultBoardGameIncludeSQ]
        },
        error_message: "cannot update library"
    });
};

exports.deleteLibraryGames = function(req, res) {
    return m2m.deleteAssociations(req, res, {
        model_class: db.LibraryGame,
        fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
        other: {
            field: 'id_board_game',
            ids: req.body.board_games,
            includes: [includes.defaultBoardGameIncludeSQ]
        },
        error_message: "cannot update library"
    });
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
        }, { ignoreDuplicates: true }).then(l => {
            return exports.sendCurrUserGames(req, res);
        }).catch(err => {
            return util.errorResponse(res);
        });
    };
    const bggId = parseInt(req.params.id);
    const source = req.params.source;
    return BoardGameController.executeIfBoardGameExists(bggId, source, req, res, createFn);
};

exports.getUserStats = function(req, res) {
    const clause = { id_user: req.params.uid };
    return Promise.all([
        // get number of games played
        db.GamePlayer.count({ where: clause }),
        // get number of attended events
        db.EventAttendee.count({ where: clause }),
        // get size of library
        db.LibraryGame.count({ where: clause, distinct: true, col: "id_board_game" }),
        // get most played board game and play count
        db.Game.findAll({
            attributes: ["id_board_game", [db.sequelize.fn("COUNT", "id_board_game"), "count"]],
            include: [Object.assign(includes.genericIncludeSQ(db.GamePlayer, 'game_players'), {
                where: clause,
                attributes: []
            })],
            group: db.sequelize.col('id_board_game'),
            order: [
                ["count", "DESC"]
            ],
            raw: true
        }).then(data => {
            if (data.length === 0) {
                return { count: 0, board_game: null };
            }
            return db.BoardGame.findByPk(data[0].id_board_game).then(board_game => {
                return { board_game: board_game, count: parseInt(data[0].count) };
            });
        }),
        // get total play time (exclude null duration)
        db.GamePlayer.findAll({
            where: clause,
            include: [Object.assign(includes.defaultGameIncludeSQ, {
                where: {
                    ["duration"]: {
                        [db.Op.ne]: null } },
                attributes: []
            })],
            attributes: [
                [db.sequelize.fn("SUM", db.sequelize.col('game.duration')), "total"]
            ],
            group: 'id_user',
            raw: true
        }).then(data => {
            return data.length === 0 ? 0 : parseInt(data[0].total);
        })
    ]).then(values => {
        return util.successResponse(res, {
            "played": values[0],
            "attended": values[1],
            "owned": values[2],
            "most_played": values[3],
            "play_time": values[4]
        });
    }).catch(err => {
        return util.errorResponse(res);
    });
};

exports.getUserActivities = function(req, res) {
    const uid = parseInt(req.params.uid);
    return util.sendModelOrError(res, Activity.getUserActivitiesPromise(uid, 10));
};

// Wish-to-play list
exports.addToWishToPlayBoardGames = function(req, res) {
    return m2m.addAssociations(req, res, {
        model_class: db.WishToPlayBoardGame,
        fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
        other: {
            ids: req.body.board_games,
            field: 'id_board_game',
            includes: [includes.defaultBoardGameIncludeSQ]
        },
        error_message: "cannot update wish to play list"
    })
};

exports.sendWishToPlayList = function(uid, req, res) {
    return m2m.sendAssociations(res, {
        model_class: db.WishToPlayBoardGame,
        fixed: { id: uid, field: 'id_user' },
        other: {  includes: [includes.defaultBoardGameIncludeSQ] }
    });
};

exports.getCurrentUserWishToPlayBoardGames = function(req, res) {
    return exports.sendWishToPlayList(userutil.getCurrUserId(req), req, res);
};

exports.getUserWishToPlayBoardGames = function(req, res) {
    return exports.sendWishToPlayList(parseInt(req.params.uid), req, res);
};

exports.deleteFromWishToPlayList = function(req, res) {
    return m2m.deleteAssociations(req, res, {
        model_class: db.WishToPlayBoardGame,
        fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
        other: {
            ids: req.body.board_games,
            field: 'id_board_game',
            includes: [includes.defaultBoardGameIncludeSQ]
        },
        error_message: "cannot update wish to play list"
    })
};

exports.addBoardGameAndAddToWishToPlay = function(req, res) {
    const createFn = (board_game, req, res) => {
        return db.WishToPlayBoardGame.create({
            id_user: userutil.getCurrUserId(req),
            id_board_game: board_game.id
        }, { ignoreDuplicates: true }).then(l => {
            return exports.getCurrentUserWishToPlayBoardGames(req, res);
        }).catch(err => {
            return util.errorResponse(res);
        });
    };
    const bggId = parseInt(req.params.id);
    const source = req.params.source;
    return BoardGameController.executeIfBoardGameExists(bggId, source, req, res, createFn);
};

// Friends
const formatUserFriends = async function(id_user) {
    let users1 = await db.Friendship.findAll({
        where: { id_user1: id_user },
        include: [ includes.getUserIncludeSQ('user2') ]
    });
    let users2 = await db.Friendship.findAll({
        where: { id_user2: id_user },
        include: [ includes.getUserIncludeSQ('user1') ]
    });
    return users1.map(f => f.user2).concat(users2.map(f => f.user1));
};

exports.getCurrentUserFriends = function(req, res) {
    const uid = userutil.getCurrUserId(req);
    return util.sendModelOrError(res, formatUserFriends(uid));
};

exports.getUserFriends = function(req, res) {
    return util.sendModelOrError(res, formatUserFriends(parseInt(req.params.uid)));
};

exports.getFriendshipRequests = function(req, res) {
    return util.sendModelOrError(res, db.FriendshipRequest.findAll({
        where: {id_user_from: userutil.getCurrUserId(req)},
        include: [includes.getUserIncludeSQ('user_to')]
    }));
};

exports.sendFriendshipRequest = function(req, res) {
    return util.sendModelOrError(res, db.FriendshipRequest.create({
        id_user_from: userutil.getCurrUserId(req),
        id_user_to: req.body.id_recipient,
        status: db.FriendshipRequest.STATUS_PENDING
    }, {
        include: [includes.getUserIncludeSQ('user_to')]
    }));
};

exports.handleFriendshipRequest = function(req, res) {
    const current_user_id =  userutil.getCurrUserId(req);
    const id_sender = req.body.id_sender;
    return db.sequelize.transaction(t => {
        return db.FriendshipRequest.findOne({
            where: {
                id_user_from: id_sender,
                id_user_to: current_user_id,
                status: db.FriendshipRequest.STATUS_PENDING
            },
            transaction: t
        }).then(async request => {
            const accept = req.body.accept;
            request.status = accept ? db.FriendshipRequest.STATUS_ACCEPTED : db.FriendshipRequest.STATUS_REJECTED;
            if (accept) {
                await db.Friendship.create({
                    id_user1: current_user_id,
                    id_user2: id_sender
                });
            }
            return util.sendModelOrError(res, request.save({
                transaction: t,
                include: [includes.getUserIncludeSQ('user_to')]
            }));
        })
    }).catch(err => {
        return util.detailErrorResponse(res, 404, "request not found");
    });
};

exports.deleteFriendshipRequest = function (req, res) {
    const current_user_id =  userutil.getCurrUserId(req);
    return util.handleDeletion(res, db.FriendshipRequest.destroy({
        where: {
            id_user_from: current_user_id,
            id_user_to: req.body.id_recipient,
            status: db.FriendshipRequest.STATUS_PENDING
        }
    }));
};

exports.deleteFriend = function (req, res) {
    const current_user_id =  userutil.getCurrUserId(req);
    const friend_id = parseInt(req.params.uid);
    return util.handleDeletion(res, db.Friendship.destroy({
        where: {
            [db.Op.or]: [
                {id_user1: current_user_id, id_user2: friend_id},
                {id_user1: friend_id, id_user2: current_user_id}
            ]
        }
    }));
};
