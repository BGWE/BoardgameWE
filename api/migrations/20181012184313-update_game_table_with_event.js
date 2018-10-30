'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.addColumn("Games", "id_event", {
          type: Sequelize.INTEGER,
          allowNull: true,
          foreignKey: {table: "Events", key: "id"}
      })
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.removeColumn("Games", "id_event");
  }
};
