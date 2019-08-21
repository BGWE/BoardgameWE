const db = require("./models/index");
const userutil = require("./util/user");
const util = require("./util/util");

var AchievementType = {
    smaller: 1,
    greater: 2,
  };

class Achievement {
    constructor(id, conditions) {
        this.id = id;
        this.conditions = conditions;
    }

    async checkConditions(uid) {
        return await this.conditions(uid);
    }
}

class TresholdAchievement extends Achievement {
    constructor(id, conditions, type, value) {
        super(id, conditions);
        this.value = value;
        this.type = type;
    }

    async checkConditions(uid) {
        let active = false;
        if (this.type == AchievementType.greater) {
            active = (await this.conditions(uid) >= this.value);
        }
        return active;
    }
}

handleError = function(error) {
    console.log(error);
    return -1;
}

dummyFunction = function(uid) {
    return 0;
}

// TODO: Checks whether a user possesses Azul, Scythe and 7 wonders
checkTasteful = async function(uid) {
    return 0;
}

countNumberOfGames = async function(uid) {
    return await db.GamePlayer.count({
        where: { id_user: uid }
    });
}

countNumberOfEvents = async function(uid) {
    return await db.EventAttendee.count({
        where: { id_user: uid }
    });
}

countNumberOfBoardGames = async function(uid) {
    return await db.LibraryGame.count({
        where: { id_user: uid },
        distinct: true,
        col: "id_board_game"
    })
}

const achievementsDict = {};
achievementsDict['a.events.losses'] = new Achievement('a.events.losses', dummyFunction);
achievementsDict['a.events.victories'] = new Achievement('a.events.victories', dummyFunction);
achievementsDict['a.events.number.0'] = new TresholdAchievement('a.events.number.0', countNumberOfEvents, AchievementType.greater, 5);
achievementsDict['a.events.number.1'] = new TresholdAchievement('a.events.number.1', countNumberOfEvents, AchievementType.greater, 15);

achievementsDict['a.games.number.0'] = new TresholdAchievement('a.games.number.0', countNumberOfGames, AchievementType.greater, 15);
achievementsDict['a.games.number.1'] = new TresholdAchievement('a.games.number.1', countNumberOfGames, AchievementType.greater, 30);

achievementsDict['a.boardgames.number.0'] = new TresholdAchievement('a.boardgames.number.0', countNumberOfBoardGames, AchievementType.greater, 5);
achievementsDict['a.boardgames.number.1'] = new TresholdAchievement('a.boardgames.number.1', countNumberOfBoardGames, AchievementType.greater, 15);
achievementsDict['a.boardgames.number.2'] = new TresholdAchievement('a.boardgames.number.2', countNumberOfBoardGames, AchievementType.greater, 30);
achievementsDict['a.boardgames.tasteful'] = new Achievement('a.boardgames.tasteful', checkTasteful);

achievementsDict['a.eastereggs.onion'] = new Achievement('a.eastereggs.onion', dummyFunction);

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
}

exports.sendUserAchievements = async function(uid, req, res) {
    let achievements = await db.UsersAchievements.findAll({where: { id_user: uid }});
    let newAchievements = await exports.checkAchievements(achievements, uid);
    achievements.concat(newAchievements);

    return util.successResponse(res, achievements);
}

exports.getCurrentUserAchievements = async function(req, res) {
    let response = await exports.sendUserAchievements(userutil.getCurrUserId(req), req, res);
    return response;
}

exports.getUserAchievements = async function(req, res) {
    console.log(req.params);
    let response = await exports.sendUserAchievements(parseInt(req.params.uid), req, res);
    return response;
}

addAchievement = function(uid, achievement_id) {
    db.UsersAchievements.findOrCreate({where :{
        id_achievement: achievement_id,
        id_user: uid
    }, defaults: {
        id_achievement: achievement_id,
        id_user: uid}
    });
}

exports.addOnionAchievement = function(req, res) {
    let uid = userutil.getCurrUserId(req);
    addAchievement(uid, 'a.eastereggs.onion');
}

exports.getTotalNumberOfAchievements = async function(req, res) {
    return util.successResponse(res, Object.keys(achievementsDict).length);
}
