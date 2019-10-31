'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("PlayedExpansions", {
      id_board_game: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {model: 'BoardGames', key: 'id'},
        onDelete: 'cascade'
      },
      id_game: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {model: 'Games', key: 'id'},
        onDelete: 'cascade'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("BoardGameExpansions");
  }
};
