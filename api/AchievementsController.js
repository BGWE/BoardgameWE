const db = require("./models/index");
const userutil = require("./util/user");
const util = require("./util/util");

var AchievementType = {
    smaller: 1,
    equal: 2,
    greater: 3
  };

class Achievement {
    constructor(id, conditions) {
        this.id = id;
        this.conditions = conditions;
    }

    async checkConditions(uid) {
        return await this.conditions(uid);
    }

    getName() {
        return this.id + ".name";
    }

    getDescription() {
        return this.id + ".description";
    }

    getId() {
        return this.id;
    }

    getType() {
        return this.type;
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
            active = (await this.conditions(uid) > this.value);
        } else if (this.type == AchievementType.smaller) {
            active = (await this.conditions(uid) < this.value);
        } else if (this.type == AchievementType.equal) {
            active = (await this.conditions(uid) == this.value);
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

checkNumberOfGames = async function(uid) {
    return await db.GamePlayer.count({
        where: { id_user: uid }
    });
}

checkNumberOfEvents = async function(uid) {
    return await db.EventAttendee.count({
        where: { id_user: uid }
    });
}

checkNumberOfBoardGames = async function(uid) {
    return await db.LibraryGame.count({
        where: {id_user: uid },
        distinct: true,
        col: "id_board_game"
    })
}

const achievementsDict = {};
achievementsDict['a.events.losses'] = new Achievement('a.events.losses', dummyFunction);
achievementsDict['a.events.victories'] = new Achievement('a.events.victories', dummyFunction);
achievementsDict['a.events.number.0'] = new TresholdAchievement('a.events.number.0', checkNumberOfEvents, 5);
achievementsDict['a.events.number.1'] = new TresholdAchievement('a.events.number.1', checkNumberOfEvents, 15);
achievementsDict['a.games.number.0'] = new TresholdAchievement('a.games.number.0', checkNumberOfGames, 15);
achievementsDict['a.games.number.1'] = new TresholdAchievement('a.games.number.1', checkNumberOfGames, 30);
achievementsDict['a.boardgames.number.0'] = new TresholdAchievement('a.boardgames.number.0', checkNumberOfBoardGames, 5);

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
            console.log("Gained achievement" + a.getId());
            addAchievement(uid, a.getId());
            newAchievements.push(a);
        }
    }
    return newAchievements;
}

preProcessAchievements = function(achievements) {
    return achievements.map(achievement => {
        a = achievementsDict[achievement.id_achievement];
        achievement.setDataValue('name', a.getName());
        achievement.setDataValue('description', a.getDescription());
        achievement.setDataValue('type', a.getType());
        return achievement;
    });
}

exports.getCurrentUserAchievements = async function(req, res) {
    let uid = userutil.getCurrUserId(req);

    let achievements = await db.UsersAchievements.findAll({
        where: { id_user: uid }
    });
    let newAchievements = await exports.checkAchievements(achievements, uid);
    preProcessAchievements(achievements);
    return util.successResponse(res, achievements.concat(newAchievements));
}

addAchievement = function(uid, achievement_id) {
    db.UsersAchievements.upsert({
        id_achievement: achievement_id,
        id_user: uid
    });
}
