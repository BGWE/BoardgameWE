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
      id_user: {
        type: Sequelize.INTEGER,
        allowNull: true, // because we might add players not registered on the app
        references: { model: 'Users', key: 'id' }
      },
      id_game: {
        type: Sequelize.INTEGER,
        references: { model: 'Games', key: 'id' }
      },
      score: {
        type: Sequelize.INTEGER
      },
      name: {
          type: Sequelize.STRING,
          allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
    .then(() => {
      return queryInterface.addConstraint('GamePlayers', ['id_user', 'id_game'], {
        type: 'unique',
        name: 'game_player_unique'
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("GamePlayers");
  }
};
