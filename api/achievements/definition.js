

const lodash = require("lodash");
const checks = require("./checks");

/**
 * Achievements: a certain milestone in the life of a board game player
 * Badges: a sequence of achievements, ussually of increasing difficulty
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

const S = { BGA: "BGA", GAM: "GAM", EVE: "EVE", INT: "INT"};

exports.S = S;
exports.SCOPES = S;

const make_code = (scope, is_badge, name, progress) => {
  if (!exports.SCOPES[scope]) {
    throw new Error("invalid scope");
  }
  if (is_badge && progress === undefined) {
    throw  new Error("missing progress for badge");
  }
  return scope + "_" + (is_badge ? "B_" + String(progress).padStart(2, "0") : "A") + "_" + name.toUpperCase().substr(0, 32);
};

exports.make_code = make_code;

/**
 *
 * @param scope Scope of the achievement
 * @param name Name of the achievement (not human shown name)
 * @param check_fn An async function with prototype (id_user) => Promise{Bool}. The function returns a boolean promise
 * that returns true when the conditions of the achievement are met, false otherwise.
 * @param badge_progress null|undefined|int If defined and an integer, indicates the achievement is a badge and which
 * is its progress
 * @param meta Object additional data to be associated with the achievement
 * @returns {{}}
 */
const make_achievement = (scope, name, check_fn, badge_progress, meta) => {
  const is_badge = badge_progress !== undefined && badge_progress !== null;
  const progress = badge_progress;
  const identifier = make_code(scope, is_badge, name, progress);
  return {
    name: name,
    progress: progress,
    scope: scope,
    is_badge: is_badge,
    previous: is_badge && progress > 0 ? make_code(scope, is_badge, name, progress - 1) : null,
    code: identifier,
    meta, check_fn
  };
};

/**
 *
 * @param badges A list of objects. Each object should contain the data necessary for the badge achievement creation
 * @param scope string The scope of the badge
 * @param name string The name of the badge
 * @param make_check_fn A function for generated an appropriate check function based on the badge data
 * @returns {any}
 */
const make_badges = (badges, scope, name, make_check_fn) => {
  return badges.map((badge, index) => make_achievement(scope, name, make_check_fn(badge, index), index, badge));
};

const array2obj = (arr, k) => {
  return arr.map(v => { return {[k]: v};});
};

const N = {};
N.EASTER_EGG_ONION = "easteregg-onion";
N.BOARD_GAME_PLAYED = "played";
N.BOARD_GAME_OWNED = "owned";
N.GAME_PLAYED = "played";
N.GAME_LOST = "lost";
N.GAME_WON = "won";
N.EVENT_ATTENDED = "attended";
N.TASTEFUL = "tasteful";

exports.N = N;
exports.NAMES = N;

// each field is an achievement
const A = {};
A.EASTER_EGG_ONION = make_achievement(S.INT, N.EASTER_EGG_ONION, checks.false_check);
// A.TASTEFUL = make_achievement(S.BGA, N.TASTEFUL, checks.check_tasteful);

exports.A = A;
exports.ACHIEVEMENTS = A;

// each field is an array of achievements (sorted by increasing difficulty)
const B = {};
B.BOARD_GAME_PLAYED = make_badges(array2obj([1, 5, 15, 30], "cnt"), S.BGA, N.BOARD_GAME_PLAYED, b => checks.check_count_fn(checks.bga_played_count, b.cnt));
B.BOARD_GAME_OWNED = make_badges(array2obj([1, 5, 10, 25], "cnt"), S.BGA, N.BOARD_GAME_OWNED, b => checks.check_count_fn(checks.bga_owned_count, b.cnt));
B.GAME_PLAYED = make_badges(array2obj([1, 15, 30], "cnt"), S.GAM, N.GAME_PLAYED, b => checks.check_count_fn(checks.game_played_count, b.cnt));
B.EVENT_ATTENDED = make_badges(array2obj([1, 5, 15], "cnt"), S.EVE, N.EVENT_ATTENDED, b => checks.check_count_fn(checks.event_attended_count, b.cnt));
B.GAME_LOST = make_badges(array2obj([1, 5, 15], "cnt"), S.GAM, N.GAME_LOST, b => checks.check_count_fn(checks.game_lost_count, b.cnt));
B.GAME_WON = make_badges(array2obj([1, 5, 15], "cnt"), S.GAM, N.GAME_WON, b => checks.check_count_fn(checks.game_won_count, b.cnt));

exports.B = B;
exports.BADGES = B;

// all
const ALL = lodash.flatten(lodash.valuesIn(B)).concat(lodash.valuesIn(A)).reduce((acc, ach) => {
  acc[ach.code] = ach;
  return acc;
}, {});

exports.ALL = ALL;

/**
 * Add other achievement fields to all entries of an array of database-fetched list of achievements (i.e. each object
 * in the list has field id_user and id_achievement).
 * @param achvmts Array
 * @returns {*}
 */
exports.augment = (achvmts) => {
  return achvmts.map(a => {
    return {id_user: a.id_user, id_achievement: a.id_achievement, ...ALL[a.id_achievement]};
  });
};