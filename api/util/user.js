const jwt = require("jsonwebtoken");

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

exports.getCurrUserId = function(req) {
    return exports.getTokenPayload(req).id;
};

function generateSecretForUser(oldpasswordHash, userCreatedAt) {
    return oldpasswordHash + userCreatedAt;
}

exports.getResetPasswordToken = function(userId, userEmail, oldpasswordHash, userCreatedAt) {
    let secret = generateSecretForUser(oldpasswordHash, userCreatedAt);
    let payload = {
        email: userEmail,
        id: userId
    };

    return jwt.sign(payload, secret);
};

exports.getPayloadFromResetPasswordToken = function(token, oldpasswordHash, userCreatedAt) {
    return jwt.decode(token, generateSecretForUser(oldpasswordHash, userCreatedAt));
}