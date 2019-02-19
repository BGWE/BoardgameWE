'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Events', 'start', { type: Sequelize.DATEONLY });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Events', 'start', { type: Sequelize.DATE });
  }
};
