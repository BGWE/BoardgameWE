'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('PlayerGameTimers', ['id_user', 'id_timer'], {
      type: 'unique',
      name: 'game_player_per_timer_unique'
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('PlayerGameTimers', 'game_player_per_timer_unique');
  }
};
