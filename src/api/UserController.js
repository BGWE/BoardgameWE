const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Sequelize = require('sequelize');
const config = require('./config/config.js');
const db = require('./models/index');
const util = require('./util/util');
const userutil = require('./util/user');
const emailutil = require('./util/email');
const includes = require('./util/db_include');
const BoardGameController = require('./BoardGameController');
const Activity = require('./util/activities');
const m2m = require('./util/m2m_helpers');
const logging = require('./util/logging');

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
exports.removeSensitive = function removeSensitive(user) {
  const attributes = includes.userExcludedAttributes;
  for (let i = 0; i < attributes.length; i++) {
    user[attributes[i]] = undefined;
  }
  return user;
};

const handleUserResponse = function handleUserResponse(res, promise) {
  return util.sendModel(res, promise, (user) => exports.removeSensitive(user));
};

exports.signIn = function signIn(req, res) {
  return db.User.findOne({
    where: { username: { [Sequelize.Op.iLike]: `%${req.body.username}%` } },
  }).then((user) => {
    if (!user) {
      return util.detailErrorResponse(res, 401, 'Authentication failed. User not found.');
    }
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      surname: user.surname,
      name: user.name,
    };
    return user.validPassword(req.body.password).then((passwordOk) => {
      if (!passwordOk) {
        return util.detailErrorResponse(res, 401, 'Authentication failed. User not found.');
      } if (!user.validated) {
        return util.detailErrorResponse(res, 403, exports.notValidatedErrorMsg);
      }
      return util.successResponse(res, {
        token: jwt.sign(
          tokenPayload,
          config.jwt_secret_key,
          { expiresIn: config.jwt_duration },
        ), // 4 days
      });
    });
  });
};

exports.register = function register(req, res) {
  return bcrypt.hash(req.body.password, 10)
    .then((hash) => db.sequelize.transaction((transaction) => db.User.findOne({
      where: {
        [db.Op.or]: [
          { email: req.body.email },
          { username: req.body.username },
        ],
      },
      transaction,
    }).then((user) => {
      if (user) {
        return util.detailErrorResponse(res, 403, 'user exists');
      }
      return db.User.create({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: hash,
        username: req.body.username,
        admin: false, // by default not admin
        validated: null, // by default not accepted nor refused
      }, { transaction }).then(
        (user_) => util.successResponse(res, exports.removeSensitive(user_)),
      );
    })));
};

exports.getCurrentUser = function getCurrentUser(req, res) {
  const userId = userutil.getCurrUserId(req);
  return handleUserResponse(res, db.User.findByPk(userId));
};

exports.getUser = function getUser(req, res) {
  const currentUid = userutil.getCurrUserId(req);
  const uid = parseInt(req.params.uid, 10);
  return util.sendModel(res, db.User.findByPk(uid, {
    attributes: includes.userShallowAttributes,
    include: includes.getFriendshipIncludesSQ(currentUid),
  }), (u) => includes.formatShallowUserWithCurrent(u, currentUid));
};

exports.updateUser = function updateUser(req, res) {
  // TODO security: implement token invalidation check when password changes
  const userId = userutil.getCurrUserId(req);
  return db.User.findByPk(userId, {})
    .then((user) => {
      if (!user) {
        return util.detailErrorResponse(res, 404, 'User not found.');
      }
      const updateFn = function updateFn() {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.name = req.body.name || user.name;
        user.surname = req.body.surname || user.surname;
        if (req.body.password) {
          return bcrypt.hash(req.body.password, 10, (err, hash) => {
            user.password = hash;
            return handleUserResponse(res, user.save());
          });
        }
        return handleUserResponse(res, user.save());
      };

      if (req.body.password !== undefined) {
        user.validPassword(req.body.old_password).then(
          (passwordOk) => {
            if (passwordOk) {
              return updateFn();
            }
            return util.detailErrorResponse(res, 403, 'invalid/missing old password');
          },
        );
      } else {
        return updateFn();
      }
    });
};

exports.forgotPassword = function forgotPassword(req, res) {
  return db.User.findOne({
    where: { email: req.body.email },
  }).then((user) => {
    if (!user) {
      return util.detailErrorResponse(res, 404, 'User not found.');
    }
    return emailutil.sendResetPasswordEmail(
      user.email,
      config.email_settings.email_address,
      config.email_settings.sender_name,
      user.name,
      userutil.getResetPasswordFrontendUrl(user.id, user.email, user.password, user.createdAt),
    ).then(() => util.successResponse(res));
  });
};

exports.resetPassword = function resetPassword(req, res) {
  const { token } = req.body;
  const userId = req.body.id;
  const { password } = req.body;

  return db.User.findByPk(userId).then((user) => {
    if (!user) {
      return util.detailErrorResponse(res, 404, 'user not found');
    }
    try {
      userutil.getPayloadFromResetPasswordToken(token, user.password, user.createdAt);
    } catch (error) {
      return util.detailErrorResponse(res, 403, 'failed to process the token');
    }

    // Token is ok
    return bcrypt.hash(password, 10, (err, hash) => {
      user.password = hash;
      return handleUserResponse(res, user.save());
    });
  });
};

/**
 * Send the list of games in the library of the currently connected user in the response.
 * (or a 500 error).
 * @returns {Promise<Array<Model>>}
 */
exports.sendCurrUserGames = function sendCurrUserGames(req, res) {
  return exports.sendUserLibraryGames(userutil.getCurrUserId(req), req, res);
};

/**
 * Send the current list of games in the library of a given user in the response (or a 500 error)
 * @returns {Promise<Array<Model>>}
 */
exports.sendUserLibraryGames = function sendUserLibraryGames(uid, req, res, transaction) {
  return m2m.sendAssociations(res, {
    model_class: db.LibraryGame,
    fixed: { id: uid, field: 'id_user' },
    other: { includes: [includes.defaultBoardGameIncludeSQ] },
    options: { transaction },
  });
};

exports.addLibraryGames = function addLibraryGames(req, res) {
  return m2m.addAndSendAssociations(req, res, {
    model_class: db.LibraryGame,
    fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
    other: {
      field: 'boardGameId',
      ids: req.body.boardGames,
      includes: [includes.defaultBoardGameIncludeSQ],
    },
    error_message: 'cannot update library',
  });
};

exports.deleteLibraryGames = function deleteLibraryGames(req, res) {
  return m2m.deleteAssociations(req, res, {
    model_class: db.LibraryGame,
    fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
    other: {
      field: 'boardGameId',
      ids: req.body.boardGames,
      includes: [includes.defaultBoardGameIncludeSQ],
    },
    error_message: 'cannot update library',
  });
};

exports.getCurrentUserLibraryGames = function getCurrentUserLibraryGames(req, res) {
  return exports.sendCurrUserGames(req, res);
};

exports.getUserLibraryGames = function getUserLibraryGames(req, res) {
  return exports.sendUserLibraryGames(req.params.uid, req, res);
};

exports.addBoardGameAndAddToLibrary = function addBoardGameAndAddToLibrary(req, res) {
  const createFn = (boardGame, req_, res_, transaction) => db.LibraryGame.create({
    id_user: userutil.getCurrUserId(req_),
    boardGameId: boardGame.id,
  }, { ignoreDuplicates: true, transaction, lock: transaction.LOCK.UPDATE })
    .then(() => exports.sendUserLibraryGames(userutil.getCurrUserId(req), req, res, transaction));

  const bggId = parseInt(req.params.id, 20);
  const { source } = req.params;
  return db.sequelize.transaction(
    (t) => BoardGameController.executeIfBoardGameExists(bggId, source, req, res, createFn, t),
  );
};

exports.getUserStats = function getUserStats(req, res) {
  const clause = { id_user: req.params.uid };
  return Promise.all([
    // get number of games played
    db.GamePlayer.count({ where: clause }),
    // get number of attended events
    db.EventAttendee.count({ where: clause }),
    // get size of library
    db.LibraryGame.count({ where: clause, distinct: true, col: 'boardGameId' }),
    // get most played board game and play count
    db.Game.findAll({
      attributes: ['boardGameId', [db.sequelize.fn('COUNT', 'boardGameId'), 'count']],
      include: [Object.assign(includes.genericIncludeSQ(db.GamePlayer, 'game_players'), {
        where: clause,
        attributes: [],
      })],
      group: db.sequelize.col('boardGameId'),
      order: [
        ['count', 'DESC'],
      ],
      raw: true,
    }).then((data) => {
      if (data.length === 0) {
        return { count: 0, boardGame: null };
      }
      return db.BoardGame.findByPk(data[0].boardGameId).then((boardGame) => ({ boardGame, count: parseInt(data[0].count, 10) }));
    }),
    // get total play time (exclude null duration)
    db.GamePlayer.findAll({
      where: clause,
      include: [Object.assign(includes.defaultGameIncludeSQ, {
        where: {
          duration: { [db.Op.ne]: null },
        },
        attributes: [],
      })],
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('game.duration')), 'total'],
      ],
      group: 'id_user',
      raw: true,
    }).then((data) => (data.length === 0 ? 0 : parseInt(data[0].total, 10))),
  ]).then((values) => util.successResponse(res, {
    played: values[0],
    attended: values[1],
    owned: values[2],
    most_played: values[3],
    play_time: values[4],
  }));
};

exports.getUserActivities = function getUserActivities(req, res) {
  const uid = parseInt(req.params.uid, 10);
  return util.sendModel(res, Activity.getUserActivitiesPromise(uid, 10));
};

// Wish-to-play list
exports.addToWishToPlayBoardGames = function addToWishToPlayBoardGames(req, res) {
  return m2m.addAndSendAssociations(req, res, {
    model_class: db.WishToPlayBoardGame,
    fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
    other: {
      ids: req.body.boardGames,
      field: 'boardGameId',
      includes: [includes.defaultBoardGameIncludeSQ],
    },
    error_message: 'cannot update wish to play list',
  });
};

exports.sendWishToPlayList = function sendWishToPlayList(uid, req, res, transaction) {
  return m2m.sendAssociations(res, {
    model_class: db.WishToPlayBoardGame,
    fixed: { id: uid, field: 'id_user' },
    other: { includes: [includes.defaultBoardGameIncludeSQ] },
    options: { transaction },
  });
};

exports.getCurrentUserWishToPlayBoardGames = function getCurrentUserWishToPlayBoardGames(req, res) {
  return exports.sendWishToPlayList(userutil.getCurrUserId(req), req, res);
};

exports.getUserWishToPlayBoardGames = function getUserWishToPlayBoardGames(req, res) {
  return exports.sendWishToPlayList(parseInt(req.params.uid, 10), req, res);
};

exports.deleteFromWishToPlayList = function deleteFromWishToPlayList(req, res) {
  return m2m.deleteAssociations(req, res, {
    model_class: db.WishToPlayBoardGame,
    fixed: { id: userutil.getCurrUserId(req), field: 'id_user' },
    other: {
      ids: req.body.boardGames,
      field: 'boardGameId',
      includes: [includes.defaultBoardGameIncludeSQ],
    },
    error_message: 'cannot update wish to play list',
  });
};

exports.addBoardGameAndAddToWishToPlay = function addBoardGameAndAddToWishToPlay(req, res) {
  const createFn = (boardGame, req, res, transaction) => db.WishToPlayBoardGame.create({
    id_user: userutil.getCurrUserId(req),
    boardGameId: boardGame.id,
  }, { ignoreDuplicates: true, transaction, lock: transaction.LOCK.UPDATE }).then(() => exports.sendWishToPlayList(userutil.getCurrUserId(req), req, res, transaction));
  const bggId = parseInt(req.params.id, 10);
  const { source } = req.params;
  return db.sequelize.transaction((t) => BoardGameController.executeIfBoardGameExists(bggId, source, req, res, createFn, t));
};

// Friends
const formatUserFriends = async function formatUserFriends(id_user) {
  const users1 = await db.Friendship.findAll({
    where: { id_user1: id_user },
    include: [includes.getShallowUserIncludeSQ('user2')],
  });
  const users2 = await db.Friendship.findAll({
    where: { id_user2: id_user },
    include: [includes.getShallowUserIncludeSQ('user1')],
  });
  return users1.map((f) => f.user2).concat(users2.map((f) => f.user1));
};

exports.getCurrentUserFriends = function getCurrentUserFriends(req, res) {
  const uid = userutil.getCurrUserId(req);
  return util.sendModel(res, formatUserFriends(uid));
};

exports.getUserFriends = function getUserFriends(req, res) {
  return util.sendModel(res, formatUserFriends(parseInt(req.params.uid, 10)));
};

exports.getFriendshipRequests = function getFriendshipRequests(req, res) {
  return util.sendModel(res, db.FriendshipRequest.findAll({
    where: {
      status: db.FriendshipRequest.STATUS_PENDING,
      id_user_to: userutil.getCurrUserId(req),
    },
    include: [includes.getShallowUserIncludeSQ('user_from')],
  }));
};

exports.getSentFriendshipRequest = function getSentFriendshipRequest(req, res) {
  return util.sendModel(res, db.FriendshipRequest.findAll({
    where: {
      status: db.FriendshipRequest.STATUS_PENDING,
      id_user_from: userutil.getCurrUserId(req),
    },
    include: [includes.getShallowUserIncludeSQ('user_to')],
  }));
};

exports.sendFriendshipRequest = function sendFriendshipRequest(req, res) {
  return util.sendModel(res, db.FriendshipRequest.create({
    id_user_from: userutil.getCurrUserId(req),
    id_user_to: req.body.id_recipient,
    status: db.FriendshipRequest.STATUS_PENDING,
  }, {
    include: [includes.getShallowUserIncludeSQ('user_to')],
  }));
};

exports.handleFriendshipRequest = function handleFriendshipRequest(req, res) {
  const currentUserId = userutil.getCurrUserId(req);
  const { id_sender } = req.body;
  return db.sequelize.transaction((t) => db.FriendshipRequest.findOne({
    where: {
      id_user_from: id_sender,
      id_user_to: currentUserId,
      status: db.FriendshipRequest.STATUS_PENDING,
    },
    transaction: t,
  }).then(async (request) => {
    const { accept } = req.body;
    request.status = accept ? db.FriendshipRequest.STATUS_ACCEPTED : db.FriendshipRequest.STATUS_REJECTED;
    if (accept) {
      await db.Friendship.create({
        id_user1: currentUserId,
        id_user2: id_sender,
      });
    }
    return util.sendModel(res, request.save({
      transaction: t,
      include: [includes.getShallowUserIncludeSQ('user_to')],
    }));
  })).catch((err) => util.detailErrorResponse(res, 404, 'request not found'));
};

exports.deleteFriendshipRequest = function deleteFriendshipRequest(req, res) {
  const currentUserId = userutil.getCurrUserId(req);
  return db.FriendshipRequest.destroy({
    where: {
      id_user_from: currentUserId,
      id_user_to: req.body.id_recipient,
      status: db.FriendshipRequest.STATUS_PENDING,
    },
  }).then(() => util.successResponse(res, exports.successObj));
};

exports.deleteFriend = function deleteFriend(req, res) {
  const currentUserId = userutil.getCurrUserId(req);
  const friend_id = parseInt(req.params.uid, 10);
  return db.Friendship.destroy({
    where: {
      [db.Op.or]: [
        { id_user1: currentUserId, id_user2: friend_id },
        { id_user1: friend_id, id_user2: currentUserId },
      ],
    },
  }).then(() => util.successResponse(res, exports.successObj));
};
