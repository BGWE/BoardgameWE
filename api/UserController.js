const config = require("./config/config.js");
const db = require("./models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signIn = function(req, res) {
    db.User.findOne({ where:{
        password: bcrypt.hashSync(req.body.password, 10),
        username: req.body.username
    }}).then(user => {
        if (!user) {
            res.status(401).json({ message: 'Authentication failed. User not found.' });
        } else {
            let token_payload = {
                email: user.email,
                username: user.username,
                surname: user.surname,
                name: user.name, id: user._id
            };
            return res.json({
                token: jwt.sign(token_payload, config.jwt_secret_key, {expiresInMinutes: 5760}) // 4 days
            });
        }
    })
};

exports.register = function(req, res) {
    db.User.build({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        username: req.body.username
    }).save()
        .then((user) => {
            user.password = undefined;  // security
            res.status(200).json(user);
        })
        .catch((err) => { res.status(403).send({error: "username or email exists"}); });
};

exports.loginRequired = function(req, res) {

};