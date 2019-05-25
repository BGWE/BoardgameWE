'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint("Games", ["id_timer"], {
      type: "unique",
      name: "game_id_timer_unique_constraint",
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint("Games", "game_id_timer_unique_constraint");
  }
};
