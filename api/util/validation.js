

const moment = require("moment");

exports.toMoment = value => moment.utc(value, moment.ISO_8061);
exports.checkIso8601 = value => exports.toMoment(value).isValid();
exports.isAfter = function(other) {
    return (value, { req, location, path }) => {
        const after = exports.toMoment(value);
        const before = exports.toMoment(req[location][other]);
        if (!after.isAfter(before)) {
            throw new Error("'" + other + "' should be before '" + path + "'");
        }
        return true;
    }
};