'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("BoardGames", "min_players", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "max_players", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "min_playing_time", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "max_playing_time", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "playing_time", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "thumbnail", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "image", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "description", {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "year_published", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "category", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "mechanic", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("BoardGames", "family", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      })
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("BoardGames", "min_players"),
      queryInterface.removeColumn("BoardGames", "max_players"),
      queryInterface.removeColumn("BoardGames", "min_playing_time"),
      queryInterface.removeColumn("BoardGames", "max_playing_time"),
      queryInterface.removeColumn("BoardGames", "playing_time"),
      queryInterface.removeColumn("BoardGames", "thumbnail"),
      queryInterface.removeColumn("BoardGames", "image"),
      queryInterface.removeColumn("BoardGames", "description"),
      queryInterface.removeColumn("BoardGames", "year_published"),
      queryInterface.removeColumn("BoardGames", "category"),
      queryInterface.removeColumn("BoardGames", "mechanic"),
      queryInterface.removeColumn("BoardGames", "family")
    ]);
  }
};
