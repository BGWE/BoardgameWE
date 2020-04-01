'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.changeColumn('Events', 'end', {type: Sequelize.DATE}, {transaction}),
        queryInterface.changeColumn('Events', 'start', {type: Sequelize.DATE}, {transaction})
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.changeColumn('Events', 'end', {type: Sequelize.DATEONLY}, {transaction}),
        queryInterface.changeColumn('Events', 'start', {type: Sequelize.DATEONLY}, {transaction})
      ]);
    });
  }
};
