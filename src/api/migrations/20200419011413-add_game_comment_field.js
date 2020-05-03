'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Games", "comment", {
      type: Sequelize.TEXT,
      defaultValue: "",
      allowNull: false
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Games", "comment");
  }
};
