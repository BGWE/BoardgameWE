'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addConstraint('PlayerGameTimers', ['id_timer'], {
        type: 'FOREIGN KEY',
        name: 'player_game_timer_id_fk_constraint',
        references: { //Required field
          table: 'GameTimers',
          field: 'id'
        },
        onDelete: 'cascade'
      }),
      queryInterface.addConstraint('GameTimers', ['id_board_game'], {
        type: 'FOREIGN KEY',
        name: 'timer_board_game_id_fk_constraint',
        references: { //Required field
          table: 'BoardGames',
          field: 'id'
        },
        onDelete: 'set null'
      }),
      queryInterface.addConstraint('GameTimers', ['id_event'], {
        type: 'FOREIGN KEY',
        name: 'timer_event_id_fk_constraint',
        references: { //Required field
          table: 'Events',
          field: 'id'
        },
        onDelete: 'set null'
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeConstraint('PlayerGameTimers', 'player_game_timer_id_fk_constraint'),
      queryInterface.removeConstraint('GameTimers', 'timer_board_game_id_fk_constraint'),
      queryInterface.removeConstraint('GameTimers', 'timer_event_id_fk_constraint')
    ]);
  }
};
