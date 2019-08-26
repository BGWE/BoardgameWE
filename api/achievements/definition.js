const deepfreeze = require("deep-freeze-strict");
const lodash = require("lodash");
const checks = require("./checks");
const {boolOrDefault} = require("../util/util.js");

/**
 * Achievements: a certain milestone in the life of a board game player
 * Badges: a sequence of achievements, usually of increasing difficulty
 *
 * Achievement identifier:
 *
 * SCOPE_TYPE_(B|A)[_PR]_NAME
 *
 * SCOPE: what type of event changes the score
 * B: is a badge
 * A: is an achievement
 * NAME: an unique textual identifier
 * PR: (only for badges) starts at 0, indicate the number of other badges to obtain before this one becomes available
 *
 * Scopes:
 * - BGA: board game
 * - GAM: game
 * - EVE: events
 * - INT: interaction with the website
 */

const I18N_PREFIX = "achievements";
const I18N_TITLE = "title";
const I18N_DESCRIPTION = "descr";
const S = { BGA: "BGA", GAM: "GAM", EVE: "EVE", INT: "INT"};

exports.S = S;
exports.SCOPES = S;

const make_code = (scope, name, progress) => {
  if (!exports.SCOPES[scope]) {
    throw new Error("invalid scope");
  }
  let is_badge = progress !== undefined;
  return scope + "_" + (is_badge ? "B_" + String(progress).padStart(2, "0") : "A") + "_" + name.toUpperCase().substr(0, 32);
};

const make_i18n_key = (code, entry) => {
  return [I18N_PREFIX, code, entry].join(".");
};

exports.make_code = make_code;

/**
 * An abstract achievement: a scope, a name, a code and a descriptor
 */
class AbstractAchievement {
  constructor(scope, name) {
    this.scope = scope;
    this.name = name;
  }

  get code() {
    throw new Error("not implemented error with 'identifier' getter.");
  }

  async check(id_user) {
    throw new Error("not implemented error with 'check' async function");
  }

  get descriptor() {
    return {
      scope: this.scope,
      name: this.name,
      code: this.code
    }
  }

  augmented_descriptor(i18n) {
    return {
      ... this.descriptor,
      title: i18n.__(make_i18n_key(this.code, I18N_TITLE)),
      description: i18n.__(make_i18n_key(this.code, I18N_DESCRIPTION))
    }
  }
}

/**
 * An achievement is obtained when a certain condition becomes true
 */
class Achievement extends AbstractAchievement {
  /**
   * constructor
   * @param scope Achievement scope
   * @param name Achievement name
   * @param check_fn A boolean promise that returns true if the achievement has been obtained
   */
  constructor(scope, name, check_fn) {
    super(scope, name);
    this.check_fn = check_fn;
  }

  get code() {
    return make_code(this.scope, this.name);
  }

  get descriptor() {
    return { ...super.descriptor, is_badge: false };
  }

  async check(id_user) {
    return await this.check_fn(id_user);
  }
}

/**
 * A badge is a tracking of progress evaluated by counting some entities.
 */
class Badge {
  /**
   * constructor
   * @param scope Badge scope
   * @param name Badge programmatic name
   * @param stages Stages of the badge (to be compared to the result of the count function
   * @param count_fn
   */
  constructor(scope, name, stages, count_fn) {
    this.scope = scope;
    this.name = name;
    this.stages = stages;
    this.count_fn = count_fn;
  }

  get code() {
    return this.scope + "_B_" + this.name.toUpperCase().substr(0, 32);
  }

  step(index) {
    return new BadgeStep(this, index);
  }

  get nb_steps() {
    return this.stages.length;
  }

  get steps() {
    let self = this;
    return lodash.range(this.nb_steps).map(i => self.step(i));
  }
}

/**
 * A badge step is a step of a badge (a specific stage, denoted by a given count)
 */
class BadgeStep extends AbstractAchievement {
  /**
   * constructor
   * @param badge The parent badge
   * @param step The step index
   */
  constructor(badge, step) {
    super(badge.scope, badge.name);
    this.badge = badge;
    this.step = step;
  }

  get count() {
    return this.badge.stages[this.step];
  }

  get code() {
    return make_code(this.scope, this.name, this.step);
  }

  get descriptor() {
    return {
      ... super.descriptor,
      progress: this.step,
      count: this.count,
      is_badge: true
    }
  }

  async check(id_user) {
    return await this.badge.count_fn(id_user) >= this.count;
  }

  augmented_descriptor(i18n) {
    let o = super.augmented_descriptor(i18n);
    o.description = i18n.__n(make_i18n_key(this.badge.code, I18N_DESCRIPTION), this.count);
    return o;
  }
}

const N = {};
N.EASTER_EGG_ONION = "easteregg-onion";
N.BOARD_GAME_PLAYED = "played";
N.BOARD_GAME_OWNED = "owned";
N.GAME_PLAYED = "played";
N.GAME_LOST = "lost";
N.GAME_WON = "won";
N.EVENT_ATTENDED = "attended";
N.TASTEFUL = "tasteful";
deepfreeze(N);

exports.N = N;
exports.NAMES = N;

// each field is an achievement
const A = {};
A.EASTER_EGG_ONION = new Achievement(S.INT, N.EASTER_EGG_ONION, checks.false_check);
// A.TASTEFUL = make_achievement(S.BGA, N.TASTEFUL, checks.check_tasteful);
deepfreeze(A);

exports.A = A;
exports.ACHIEVEMENTS = A;

// each field is an array of achievements (sorted by increasing difficulty)
const B = {};
B.BOARD_GAME_PLAYED = new Badge(S.BGA, N.BOARD_GAME_PLAYED, [2, 5, 15, 30], checks.bga_played_count);
B.BOARD_GAME_OWNED = new Badge(S.BGA, N.BOARD_GAME_OWNED, [1, 5, 10, 25], checks.bga_owned_count);
B.GAME_PLAYED = new Badge(S.GAM, N.GAME_PLAYED, [1, 15, 30], checks.game_played_count);
B.EVENT_ATTENDED = new Badge(S.EVE, N.EVENT_ATTENDED, [1, 5, 15], checks.event_attended_count);
B.GAME_LOST = new Badge(S.GAM, N.GAME_LOST, [1, 5, 15], checks.game_lost_count);
B.GAME_WON = new Badge(S.GAM, N.GAME_WON, [1, 5, 15], checks.game_won_count);
deepfreeze(B);

exports.B = B;
exports.BADGES = B;

// all
const ALL = lodash.flatten(lodash.valuesIn(B).map(b => b.steps)).concat(lodash.valuesIn(A)).reduce((acc, ach) => {
  acc[ach.code] = ach;
  return acc;
}, {});
deepfreeze(ALL);

exports.ALL = ALL;

const make_per_scope = () => {
  let per_score = lodash.valuesIn(S).reduce((a, v) => { a[v] = {badges: [], achievements: []}; return a; }, {});
  lodash.valuesIn(B).forEach(badge => { per_score[badge.scope].badges.push(badge); });
  lodash.valuesIn(A).forEach(achvmt => { per_score[achvmt.scope].achievements.push(achvmt); });
  return per_score;
};

const PER_SCOPE = make_per_scope();
deepfreeze(PER_SCOPE);

exports.PER_SCOPE = PER_SCOPE;

/**
 * Format one achievement into its augmented descriptor
 * @param achievement Achievement code
 * @param i18n A i18n for generated the localized part of the achievement descriptor
 * @returns {{id_achievement: *, title, description}}
 */
exports.format = (achievement, i18n) => {
  return {
    ... achievement.dataValues,
    ... ALL[achievement.id_achievement].augmented_descriptor(i18n)
  };
};

/**
 * Format all achievements in the list
 * @param achievements List of achievement
 * @param i18n A i18n for generated the localized part of the achievement descriptor
 * @param group_badges {bool} True for structuring the response by badage and achievement instead of a plain list.
 * @returns {*}
 */
exports.format_all = (achievements, i18n, group_badges) => {
  if (!boolOrDefault(group_badges, true)) {
    return achievements.map(achievement => exports.format(achievement.id_achievement, i18n));
  }

  // produce descriptor for all entries
  let formatted = {achievements: [], badges: {}};
  achievements.forEach(db_achievement => {
    let achievement = ALL[db_achievement.id_achievement];
    const descriptor = {
      ... db_achievement.dataValues,
      ... achievement.augmented_descriptor(i18n)
    };
    if (achievement instanceof BadgeStep) {
      const code = achievement.badge.code;
      if (!formatted.badges[code]) {
        formatted.badges[code] = [];
      }
      formatted.badges[code].push(descriptor);
    } else { // normal achievement
      formatted.achievements.push(descriptor);
    }
  });

  // sort badge steps by count
  lodash.entriesIn(formatted.badges).forEach(pair => {
    formatted.badges[pair[0]] = lodash.sortBy(pair[1], o => o.count);
  });

  return formatted;
};