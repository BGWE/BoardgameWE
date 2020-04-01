'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.changeColumn('BoardGames', 'gameplay_video_url', {type: Sequelize.STRING(511), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'thumbnail', {type: Sequelize.STRING(511), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'image', {type: Sequelize.STRING(511), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'category', {type: Sequelize.STRING(1023), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'mechanic', {type: Sequelize.STRING(1023), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'family', {type: Sequelize.STRING(1023), allowNull: true, defaultValue: null}, { transaction })
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.changeColumn('BoardGames', 'gameplay_video_url', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'thumbnail', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'image', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'category', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'mechanic', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}, { transaction }),
        queryInterface.changeColumn('BoardGames', 'family', {type: Sequelize.STRING(255), allowNull: true, defaultValue: null}, { transaction })
      ]);
    });
  }
};
