const Sequelize = require('sequelize');

module.exports = Object.freeze({
  ADD_BG: function ADD_BG(user_id, bg_id) {
    return {
      id_user: user_id,
      id_board_game: bg_id,
      createdAt: Sequelize.literal("(now() at time zone 'utc')"),
      updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
    }
  },
});
