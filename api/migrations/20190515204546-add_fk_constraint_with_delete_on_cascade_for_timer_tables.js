'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.addConstraint('PlayerGameTimers', ['id_timer'], {
          type: 'FOREIGN KEY',
          name: 'player_game_timer_id_fk_constraint',
          references: { //Required field
            table: 'GameTimers',
            field: 'id'
          },
          onDelete: 'cascade',
          transaction
        }),
        queryInterface.addConstraint('GameTimers', ['id_board_game'], {
          type: 'FOREIGN KEY',
          name: 'timer_board_game_id_fk_constraint',
          references: { //Required field
            table: 'BoardGames',
            field: 'id'
          },
          onDelete: 'set null',
          transaction
        }),
        queryInterface.addConstraint('GameTimers', ['id_event'], {
          type: 'FOREIGN KEY',
          name: 'timer_event_id_fk_constraint',
          references: { //Required field
            table: 'Events',
            field: 'id'
          },
          onDelete: 'set null',
          transaction
        })
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.removeConstraint('PlayerGameTimers', 'player_game_timer_id_fk_constraint', { transaction }),
        queryInterface.removeConstraint('GameTimers', 'timer_board_game_id_fk_constraint', { transaction }),
        queryInterface.removeConstraint('GameTimers', 'timer_event_id_fk_constraint', { transaction })
      ]);
    });
  }
};
