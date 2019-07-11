'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.addColumn('GameTimers', 'current_player', {type: Sequelize.INTEGER, default: 0}, {transaction}),
        queryInterface.addColumn('PlayerGameTimers', 'turn_order', {type: Sequelize.INTEGER}, {transaction})
      ])
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.removeColumn('GameTimers', 'current_player', {transaction}),
        queryInterface.removeColumn('PlayerGameTimers', 'turn_order', {transaction})
      ]);
    });
  }
};
