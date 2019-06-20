'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("BoardGames", "id_expansion_of", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: null,
      references: {model: 'BoardGames', key: 'id'},
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("BoardGames", "id_expansion_of");
  }
};
