'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable('LibraryGames', {
          id_user: {
              type: Sequelize.INTEGER,
              references: { model: 'Users', key: 'id' }
          },
          id_board_game: {
              type: Sequelize.INTEGER,
              references: { model: 'BoardGames', key: 'id' }
          },
          createdAt: {
              allowNull: false,
              type: Sequelize.DATE
          },
          updatedAt: {
              allowNull: false,
              type: Sequelize.DATE
          }
      }, {
          uniqueKeys: {
              players_unique_per_game: {
                  fields: ['id_user', 'id_board_game']
              }
          }
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('LibraryGames');
  }
};
