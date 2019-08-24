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
  let achievement = {
    name: name,
    progress: progress,
    scope: scope,
    is_badge: is_badge,
    previous: is_badge && progress > 0 ? make_code(scope, is_badge, name, progress - 1) : null,
    code: identifier,
    meta, check_fn
  };
  return {[identifier]: achievement};
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
  const achievements = badges.map((badge, index) => {
    return make_achievement(scope, name, make_check_fn(badge, index), index, badge)
  });
  return Object.assign(...achievements);
};

const array2obj = (arr, k) => {
  return arr.map(v => { return {[k]: v};});
};

const A = {
    // game played
    ...make_badges(array2obj([1, 15, 30], "cnt"), S.GAM, "played", b => checks.check_count_fn(checks.game_played_count, b.cnt)),
    ...make_badges(array2obj([1, 5, 15, 30], "cnt"), S.BGA, "played", b => checks.check_count_fn(checks.bga_played_count, b.cnt)),
    ...make_badges(array2obj([1, 5, 10, 25], "cnt"), S.BGA, "owned", b => checks.check_count_fn(checks.bga_owned_count, b.cnt)),
    ...make_badges(array2obj([1, 5, 15], "cnt"), S.EVE, "attended", b => checks.check_count_fn(checks.event_attended_count, b.cnt)),
    ...make_badges(array2obj([1, 5, 15], "cnt"), S.GAM, "lost", b => checks.check_count_fn(checks.game_lost_count, b.cnt)),
    ...make_badges(array2obj([1, 5, 15], "cnt"), S.GAM, "won", b => checks.check_count_fn(checks.game_won_count, b.cnt)),
    ...make_achievement(S.INT, "easteregg-onion", checks.false_check)
};


exports.ACHIEVEMENTS = A;
exports.A = A;



