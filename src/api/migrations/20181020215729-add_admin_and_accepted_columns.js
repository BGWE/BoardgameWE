'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("Users", "admin", {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn("Users", "validated", {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("Users", "validated"),
      queryInterface.removeColumn("Users", "admin")
    ]);
  }
};
