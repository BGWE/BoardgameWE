'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.addColumn("BoardGames", "min_players", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "max_players", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "min_playing_time", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "max_playing_time", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "playing_time", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "thumbnail", {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "image", {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "description", {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "year_published", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "category", {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "mechanic", {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        }, { transaction }),
        queryInterface.addColumn("BoardGames", "family", {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        }, { transaction })
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.removeColumn("BoardGames", "min_players", { transaction }),
        queryInterface.removeColumn("BoardGames", "max_players", { transaction }),
        queryInterface.removeColumn("BoardGames", "min_playing_time", { transaction }),
        queryInterface.removeColumn("BoardGames", "max_playing_time", { transaction }),
        queryInterface.removeColumn("BoardGames", "playing_time", { transaction }),
        queryInterface.removeColumn("BoardGames", "thumbnail", { transaction }),
        queryInterface.removeColumn("BoardGames", "image", { transaction }),
        queryInterface.removeColumn("BoardGames", "description", { transaction }),
        queryInterface.removeColumn("BoardGames", "year_published", { transaction }),
        queryInterface.removeColumn("BoardGames", "category", { transaction }),
        queryInterface.removeColumn("BoardGames", "mechanic", { transaction }),
        queryInterface.removeColumn("BoardGames", "family", { transaction })
      ]);
    });
  }
};
