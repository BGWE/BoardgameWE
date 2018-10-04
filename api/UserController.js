const config = require("./config/config.js");
const db = require("./models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * Retrieve and return the json web token from the headers
 * @param req Request
 * @returns String|null Null if token is missing
 */
exports.getToken = function(req) {
    if (!req.headers || !req.headers.authentication || !req.headers.authentication.startsWith("JWT")) {
        return null;
    }
    return req.headers.authentication.split(" ")[1].trim();
};

/**
 * Return the token payload
 * @param req Request
 * @returns String|null Null if token is missing
 */
exports.getTokenPayload = function(req) {
    return jwt.decode(this.getToken(req));
};

exports.signIn = function(req, res) {
    db.User.findOne({
        where: {username: req.body.username}
    }).then(user => {
        if (!user || !user.validPassword(req.body.password)) {
            res.status(401).json({ message: 'Authentication failed. User not found.' });
        } else {
            let token_payload = {
                id: user.id,
                email: user.email,
                username: user.username,
                surname: user.surname,
                name: user.name
            };
            return res.json({
                token: jwt.sign(token_payload, config.jwt_secret_key, {expiresIn: config.jwt_duration}) // 4 days
            });
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
                user.password = undefined;  // security
                res.status(200).json(user);
            })
            .catch((err) => {
                res.status(403).send({error: "username or email exists"});
            });
    });
};
