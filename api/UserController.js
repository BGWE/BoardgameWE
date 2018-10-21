const config = require("./config/config.js");
const db = require("./models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const util = require("./util/util");
const userutil = require("./util/user");
const includes = require("./util/db_include");

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

exports.signIn = function(req, res) {
    return db.User.findOne({
        where: {username: req.body.username}
    }).then(user => {
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed. User not found.' });
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
                        return res.status(401).json({message: 'Authentication failed. User not found.'});
                    } else if (!user.validated) {
                        return res.status(403).json({message: exports.notValidatedErrorMsg});
                    } else {
                        return res.status(200).json({
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
            return res.status(200).json(exports.removeSensitive(user));
        })
        .catch((err) => {
            return res.status(403).send({error: "username or email exists"});
        });
    });
};

exports.getCurrentUser = function(req, res) {
    let userId = userutil.getCurrUserId(req);
    return db.User.findById(userId).then(user => {
        return res.status(200).json(exports.removeSensitive(user));
    }).catch(err => {
        return res.status(500).json({err: "err"});
    });
};


exports.updateUser = function(req, res) {
    // TODO security: implement token invalidation check when password changes
    let userId = userutil.getCurrUserId(req);
    if(userId !== req.params.uid) { // TODO: allow update of another user for admins?
        return res.status(404).send({error: "cannot update data of another user"});
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
                    return user.save()
                        .then((user) => {res.status(200).send(exports.removeSensitive(user));})
                        .catch((err) => {res.status(500).send({error: "err"});});
                })
            } else {
                return user.save()
                    .then((user) => {res.status(200).send(exports.removeSensitive(user));})
                    .catch((err) => {res.status(500).send({error: "err"});});
            }

        })
        .catch(err => {
            return res.status(404).send({error: "user not found"})
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
    return db.LibraryGame.findAll({where: {id_user: uid}, include: [includes.defaultBoardGameIncludeSQ]})
        .then(games => { return res.status(200).send(games) })
        .catch(err => { return res.status(500).send({error: "err"}) });
};

exports.addLibraryGames = function(req, res) {
    if (!req.body.games) {
        return res.status(403).send({error: "missing games field"});
    }
    let userId = userutil.getCurrUserId(req);
    let games = req.body.games.map(g => { return { id_user: userId, id_board_game: g }});
    return db.LibraryGame.bulkCreate(games, { ignoreDuplicates: true })
        .then(() => { return exports.sendCurrUserGames(req, res); })
        .catch(err => { return res.status(500).send({error: "err"}); });
};

exports.deleteLibraryGames = function(req, res) {
    if (!req.body.games) {
        return res.status(403).send({error: "missing games field"});
    }
    let userId = userutil.getCurrUserId(req);
    return db.LibraryGame.destroy({
        where: {
            id_user: userId,
            id_board_game: req.body.games
        }
    }).then(() => { return exports.sendCurrUserGames(req, res); })
      .catch(err => { return res.status(500).send({error: "err"});});
};

exports.getCurrentUserLibraryGames = function(req, res) {
    return exports.sendCurrUserGames(req, res);
};

exports.getUserLibraryGames = function(req, res) {
    return exports.sendUserLibraryGames(req.params.uid, req, res);
};