'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('BoardGames', 'gameplay_video_url', {type: Sequelize.STRING(511), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'thumbnail', {type: Sequelize.STRING(511), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'image', {type: Sequelize.STRING(511), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'category', {type: Sequelize.STRING(1023), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'mechanic', {type: Sequelize.STRING(1023), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'family', {type: Sequelize.STRING(1023), allowNull: true, defaultValue: null})
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('BoardGames', 'gameplay_video_url', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'thumbnail', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'image', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'category', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'mechanic', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}),
      queryInterface.changeColumn('BoardGames', 'family', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null})
    ]);
  }
};
