const db = require("./models/index");
const userutil = require("./util/user");
const util = require("./util/util");
const Achievements = require("./achievements/definition");
const lodash = require("lodash");

const addAchievement = function (id_user, achievement) {
  const entry = { id_achievement: achievement.code, id_user };
  return db.UserAchievement.findOrCreate({ where: entry, defaults: entry });
};

exports.checkAchievements = function(id_user, scopes, check_existing) {
  // TODO implement check_existing == true
  check_existing = util.boolOrDefault(check_existing, false);
  if (check_existing) {
    throw new Error("not implemented error for 'checkAchievements' with 'check_existing==true'.");
  }
  scopes = scopes || lodash.valuesIn(Achievements.S);
  return db.sequelize.transaction(async transaction => {
    const current = await db.UserAchievement.findAll({ where: {id_user}, transaction, lock: transaction.LOCK.UPDATE });
    const current_codes = new Set(current.map(a => a.id_achievement));
    let new_codes = [];
    // only check specified scopes
    await Promise.all(scopes.map(async scope => {
      const scoped = Achievements.PER_SCOPE[scope];
      await Promise.all(scoped.badges.map(async badge => {
        const step_codes = new Set(badge.steps.map(s => s.code));
        if (util.set_diff(step_codes, current_codes).size > 0) { // don't check if all steps were validated
          const steps = await badge.validated_steps(id_user, { transaction });
          new_codes = new_codes.concat(steps.filter(s => !current_codes.has(s.code)).map(s => s.code));
        }
      }));
      await Promise.all(scoped.achievements.map(async achievement => {
        if (!current_codes.has(achievement.code)) { // only check if has not been validated
          const validated = await achievement.check(id_user, { transaction });
          if (validated) {
            new_codes.push(achievement.code);
          }
        }
      }));
    }));

    const new_entries = new_codes.map(c => { return {id_achievement: c, id_user}; });
    return await db.UserAchievement.bulkCreate(new_entries, { transaction });
  })
};

exports.sendUserAchievements = function (req, res, id_user) {
  return db.UserAchievement.findAll({
    where: {id_user}
  }).then(achvmts => {
    return util.successResponse(res, Achievements.format_all(achvmts, req));
  });
};

exports.getCurrentUserAchievements = function (req, res) {
  const uid = userutil.getCurrUserId(req);
  return exports.checkAchievements(uid).then(created => {
    return exports.sendUserAchievements(req, res, uid);
  });
};

exports.getUserAchievements = function(req, res) {
  const uid = parseInt(req.params.uid);
  return exports.checkAchievements(uid).then(created => {
    return exports.sendUserAchievements(req, res, uid);
  });
};

exports.addOnionAchievement = function(req, res) {
  return addAchievement(userutil.getCurrUserId(req), Achievements.A.EASTER_EGG_ONION).then(achvmt => {
    return util.successResponse(res, Achievements.format(achvmt[0], req));
  });
};

