'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Users", "admin", {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }).then(() => {
      return queryInterface.addColumn("Users", "valid", {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Users", "valid")
        .then(() => {
          return queryInterface.removeColumn("Users", "admin");
        });
  }
};
