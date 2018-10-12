const config = require("./config/config.js");
const db = require("./models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userutil = require("./util/user");


/**
 * Remove hashed password from user object
 * @param user
 * @returns User
 */
exports.sanitizeUser = function(user) {
    user.password = undefined;
    return user;
};

exports.signIn = function(req, res) {
    return db.User.findOne({
        where: {username: req.body.username}
    }).then(user => {
        if (!user) {
            res.status(401).json({ message: 'Authentication failed. User not found.' });
        } else {
            let token_payload = {
                id: user.id,
                email: user.email,
                username: user.username,
                surname: user.surname,
                name: user.name
            };
            return user.validPassword(req.body.password).then(
                valid => {
                    if (valid) {
                        res.status(200).json({
                            token: jwt.sign(token_payload, config.jwt_secret_key, {expiresIn: config.jwt_duration}) // 4 days
                        });
                    } else {
                        res.status(401).json({ message: 'Authentication failed. User not found.' });
                    }
                }
            )
        }
    })
};

exports.register = function(req, res) {
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        db.User.build({
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            password: hash,
            username: req.body.username
        }).save()
            .then((user) => {
                res.status(200).json(exports.sanitizeUser(user));
            })
            .catch((err) => {
                res.status(403).send({error: "username or email exists"});
            });
    });
};


exports.updateUser = function(req, res) {
    // TODO security: implement token invalidation check when password changes
    let payload = userutil.getTokenPayload(req);
    db.User.findById(payload.id)
        .then(user => {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.name = req.body.name || user.name;
            user.surname = req.body.surname || user.surname;
            if (req.body.password) {
                bcrypt.hash(req.body.password, 10, function(err, hash) {
                    user.password = hash;
                    user.save()
                        .then((user) => {res.status(200).send(exports.sanitizeUser(user));})
                        .catch((err) => {res.status(500).send({error: "err"});});
                })
            } else {
                user.save()
                    .then((user) => {res.status(200).send(exports.sanitizeUser(user));})
                    .catch((err) => {res.status(500).send({error: "err"});});
            }

        })
        .catch(err => {
            res.status(404).send({error: "user not found"})
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
    return db.LibraryGame.findAll({where: {id_user: uid}})
        .then(games => { res.status(200).send(games) })
        .catch(err => { res.status(500).send({error: "err"}) });
};

exports.addLibraryGames = function(req, res) {
    if (!req.body.games) {
        res.status(403).send({error: "missing games field"});
    }
    let userId = userutil.getCurrUserId(req);
    let games = req.body.games.map(g => { return { id_user: userId, id_board_game: g }});
    db.LibraryGame.bulkCreate(games, { ignoreDuplicates: true })
        .then(() => { return exports.sendCurrUserGames(req, res); })
        .catch(err => { res.status(500).send({error: "err"}); });
};

exports.deleteLibraryGames = function(req, res) {
    if (!req.body.games) {
        res.status(403).send({error: "missing games field"});
    }
    let userId = userutil.getCurrUserId(req);
    db.LibraryGame.destroy({
        where: {
            id_user: userId,
            id_board_game: req.body.games
        }
    }).then(() => { return exports.sendCurrUserGames(req, res); })
      .catch(err => { res.status(500).send({error: "err"});});
};

exports.getCurrentUserLibraryGames = function(req, res) {
    return exports.sendCurrUserGames(req, res);
};

exports.getUserLibraryGames = function(req, res) {
    return exports.sendUserLibraryGames(req.params.uid, req, res);
};