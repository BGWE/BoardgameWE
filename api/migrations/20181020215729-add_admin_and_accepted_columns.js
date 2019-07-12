'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.addColumn("Users", "admin", {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        }, { transaction }),
        queryInterface.addColumn("Users", "validated", {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: null
        }, { transaction })
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.removeColumn("Users", "validated", { transaction }),
        queryInterface.removeColumn("Users", "admin", { transaction })
      ]);
    });
  }
};
