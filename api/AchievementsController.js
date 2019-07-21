const db = require("./models/index");
const userutil = require("./util/user");
const util = require("./util/util");

exports.getCurrentUserAchievements = function(req, res) {
    let uid = userutil.getCurrUserId(req);
    console.log(uid);
    return util.sendModelOrError(res, db.UsersAchievements.findAll({
        where: {
            id_user: uid
        }
    }));
}

exports.getAchievements = function(req, res) {
    let uid = userutil.getCurrUserId(req);
    return util.sendModelOrError(res, db.UsersAchievements.findAll({
        where: {
            id_user: uid
        }
    }));
}