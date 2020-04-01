'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return queryInterface.createTable('LibraryGames', {
        id_user: {
          type: Sequelize.INTEGER,
          references: {model: 'Users', key: 'id'}
        },
        id_board_game: {
          type: Sequelize.INTEGER,
          references: {model: 'BoardGames', key: 'id'}
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction }).then(() => {
        return queryInterface.addConstraint('LibraryGames', ['id_user', 'id_board_game'], {
          type: 'primary key',
          name: 'library_game_pkey',
          transaction
        });
      })
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('LibraryGames');
  }
};
