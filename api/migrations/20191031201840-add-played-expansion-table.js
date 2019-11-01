'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("PlayedExpansions", {
      id_board_game: {
        type: Sequelize.INTEGER,
        references: {model: 'BoardGames', key: 'id'},
        onDelete: 'restrict'
      },
      id_game: {
        type: Sequelize.INTEGER,
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
    }).then(() => {
      return queryInterface.addConstraint('PlayedExpansions', ['id_game', 'id_board_game'], {
        type: 'primary key',
        name: 'played_expansions_pkey'
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("PlayedExpansions");
  }
};
