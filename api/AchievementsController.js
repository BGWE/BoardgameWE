const db = require("./models/index");
const userutil = require("./util/user");
const util = require("./util/util");

var AchievementType = {
    smaller: 1,
    equal: 2,
    greater: 3,
  };

class Achievement {
    constructor(id, type, condition, value) {
        this.id = id;
        this.name = id + ".name";
        this.description = id + ".description";
        this.type = type;
        this.condition = condition;
        this.value = value;
    }

    async checkConditions(uid) {
        let active = false;
        if (this.type == AchievementType.greater) {
            active = (await this.condition(uid) > this.value);
        } else if (this.type == AchievementType.smaller) {
            active = (await this.condition(uid) < this.value);
        } else if (this.type == AchievementType.equal) {
            active = (await this.condition(uid) == this.value);
        }
        console.log(active);
        return active;
    }
    
    getName() {
        return this.name;
    }

    getDescription() {
        return this.description;
    }

    getId() {
        return this.id;
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
        where: {
            id_user: uid 
        }
    });
}

checkNumberOfEvents = async function(uid) {
    return await db.EventAttendee.count({
        where: {
            id_user: uid
        }
    });
}

checkNumberOfBoardGames = async function(uid) {
    return await db.LibraryGame.count({
        where: {
            id_user: uid
        },
        distinct: true,
        col: "id_board_game"
    })
}

const achievements = [
    'a.events.losses',
    'a.events.victories',
    'a.events.number',
    'a.games.number',
    'a.boardgames.number'
]

const achievementsDict = {};
achievementsDict['a.events.losses'] = new Achievement('a.events.losses', AchievementType.greater, dummyFunction , 10);
achievementsDict['a.events.victories'] = new Achievement('a.events.victories', AchievementType.greater, dummyFunction, 10);
achievementsDict['a.events.number'] = new Achievement('a.events.number', AchievementType.greater, checkNumberOfEvents, 5);
achievementsDict['a.games.number'] = new Achievement('a.games.number', AchievementType.greater, checkNumberOfGames, 15);
achievementsDict['a.boardgames.number'] = new Achievement('a.boardgames.number', AchievementType.greater, checkNumberOfBoardGames, 5);

exports.checkAchievements = async function(uid) {
    // TODO: only check achievements we don't have yet
    for (let key in achievementsDict) {
        a = achievementsDict[key];
        if (await a.checkConditions(uid)) {
            console.log("Achievement gained");
            await exports.addAchievement(uid, a.getId());
        }
    }
}

preProcessAchievements = function(achievements) {
    return achievements.map(achievement => {
        a = achievementsDict[achievement.id_achievement];
        achievement.setDataValue('name', a.getName());
        achievement.setDataValue('description', a.getDescription());
        return achievement;
    });
}

exports.getCurrentUserAchievements = async function(req, res) {
    let uid = userutil.getCurrUserId(req);
    await exports.checkAchievements(uid);
    return util.sendModelOrError(res, db.UsersAchievements.findAll({
        where: {
            id_user: uid
        }
    }), achievements => preProcessAchievements(achievements));
}

exports.addAchievement = async function(uid, achievement_id) {
    await db.UsersAchievements.upsert({
        id_achievement: achievement_id,
        id_user: uid
    });
}