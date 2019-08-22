const db = require("../models/index");
const lodash = require("lodash");

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

const make_code = (scope, is_badge, name, {progress, other}) => {
  if (!exports.SCOPES[scope]) {
    throw new Error("invalid scope");
  }
  if (is_badge && progress === undefined) {
    throw  new Error("missing progress for badge");
  }
  let code = scope + "_" + (is_badge ? "B_" + String(progress).padStart(2, "0") : "A") + "_" + name.toUpperCase().substr(32);
  if (other !== undefined) {
    code += "_" + lodash.toPairs().map(e => e[0].toLowerCase() + "_" + e[1]);
  }
  return code;
};

const C = {
  COUNT: { // count entries
    make_query_fn(table, user_field, options) {
      let ufield = user_field === undefined ? "id_user" : user_field;
      return (id_user) => {
        return table.count({where: {[ufield]: id_user}, ...options});
      };
    }
  },
  COUNT_JOIN: { // count entries filtered based on a join (the other relation contains the user information)
    make_query_fn(table, include_table, as, number, user_field, options) {
      let ufield = user_field === undefined ? "id_user" : user_field;
      return (id_user) => {
        return table.count({
          include: [{ model: include_table, as, where: {[ufield]: id_user}, required: true }],
          ... options
        });
      };
    }
  }
};
exports.CONDITION_TYPES = C;

const check_count_fn = (count_promise, number) => {
  return async (id_user) => {
    let promise = count_promise(id_user);
    return (await promise) >= number;
  };
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
 * @returns {{code: {name: *, progress: *, scope: *, is_badge: boolean, previous: *, code: (string|*), meta: *, check_fn: *}}}
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
  return { code: achievement };
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

/**
 * Check functions
 */
const gam_victory_count = async (id_user) => {
  let games = await db.Game.findAll({ include: {model: db.GamePlayer, as: "player", where: {id_user}} });


};

const bga_played_count = C.COUNT_JOIN.make_query_fn(db.Game, db.GamePlayer, "player", "id_user", { group: "id_board_game" });
const gam_played_count = C.COUNT.make_query_fn(db.GamePlayer);
const bga_owned_count = C.COUNT.make_query_fn(db.LibraryGame);


const A = {
    // game played
    ...make_badges(array2obj([1, 5, 10, 25], "cnt"), S.GAM, "played", b => check_count_fn(gam_played_count, b.cnt)),
    ...make_badges(array2obj([1, 5, 10, 25], "cnt"), S.BGA, "played", b => check_count_fn(bga_played_count, b.cnt)),
    ...make_badges(array2obj([1, 5, 10, 25], "cnt"), S.BGA, "owned", b => check_count_fn(bga_owned_count, b.cnt))
};


// ... make_achievement(S.GAM, "victories1", C.COUNT.make_check_fn(), 0),
// ... make_achievement(S.GAM, "victories5", C.COUNT.make_check_fn(), 1),


exports.ACHIEVEMENTS = A;



