const db = require("./models/index");
const userutil = require("./util/user");
const util = require("./util/util");
const achievements = require("./achievements/definition");

const addAchievement = function (id_user, achievement) {
  const entry = { id_achievement: achievement.code, id_user };
  return db.UserAchievement.findOrCreate({ where: entry, defaults: entry });
};

// TODO: not sure how this function was supposed to work so I haven't converted it with the new definition
exports.checkAchievements = async function(oldAchievements, uid) {
    console.log("Checking achievements");

    let oldKeys = [];
    for (let a in oldAchievements) {
        oldKeys.push(oldAchievements[a].id_achievement);
    }

    let keys = Object.keys(achievementsDict);
    let filteredKeys = keys.filter( el => {
        return !oldKeys.includes(el);
    });

    let newAchievements = [];
    for (let key in filteredKeys) {
        a = achievementsDict[filteredKeys[key]];
        if (await a.checkConditions(uid)) {
            aid = a.getId();
            addAchievement(uid, aid);
            newAchievements.push({
                id_achievement: aid,
                id_user: uid
            });
            console.log("Gained achievement " + aid);
        }
    }
    return newAchievements;
};

exports.sendUserAchievements = function (req, res, id_user) {
  return db.UserAchievement.findAll({
    where: {id_user}
  }).then(achvmts => {
    return util.successResponse(res, achievements.format_all(achvmts, req));
  }).catch(err => {
    return util.errorResponse(res);
  });
};

exports.getCurrentUserAchievements = function (req, res) {
  return exports.sendUserAchievements(req, res, userutil.getCurrUserId(req));
};

exports.getUserAchievements = function(req, res) {
  return exports.sendUserAchievements(req, res, parseInt(req.params.uid));
};

exports.addOnionAchievement = function(req, res) {
  return addAchievement(userutil.getCurrUserId(req), achievements.A.EASTER_EGG_ONION).then(achvmt => {
    return util.successResponse(res, achievements.format(achvmt, req));
  }).catch(err => {
    return util.errorResponse(res);
  });
};

