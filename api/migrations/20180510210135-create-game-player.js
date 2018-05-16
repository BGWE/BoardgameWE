'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GamePlayers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_player: {
        type: Sequelize.INTEGER,
        references: { model: 'Players', key: 'id' }
      },
      id_game: {
        type: Sequelize.INTEGER,
        references: { model: 'Games', key: 'id' }
      },
      score: {
        type: Sequelize.INTEGER
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
                fields: ['id_player', 'id_game']
            }
        }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('GamePlayers');
  }
};