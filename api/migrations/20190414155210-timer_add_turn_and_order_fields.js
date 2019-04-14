'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('GameTimers', 'current_player', { type: Sequelize.INTEGER, default: 0 }),
      queryInterface.addColumn('PlayerGameTimers', 'turn_order', { type: Sequelize.INTEGER })
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
       queryInterface.removeColumn('GameTimers', 'current_player'),
       queryInterface.removeColumn('PlayerGameTimers', 'turn_order')
    ]);
  }
};
