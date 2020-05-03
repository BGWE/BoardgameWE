'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Events", "id_creator", {
      type: Sequelize.INTEGER,
      foreignKey: {table: "Users", key: "id"}
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Events", "id_creator");
  }
};
