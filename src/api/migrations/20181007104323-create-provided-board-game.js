'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ProvidedBoardGames', {
      id_board_game: {
        type: Sequelize.INTEGER,
        references: { model: 'BoardGames', key: 'id' }
      },
      id_user: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' }
      },
      id_event: {
        type: Sequelize.INTEGER,
        references: { model: 'Events', key: 'id' }
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
      return queryInterface.addConstraint('ProvidedBoardGames', ['id_user', 'id_board_game', 'id_event'], {
        type: 'primary key',
        name: 'provided_board_game_pkey'
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ProvidedBoardGames');
  }
};