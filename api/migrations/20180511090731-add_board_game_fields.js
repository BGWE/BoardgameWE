'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
        .addColumn("BoardGames", "min_players", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null
        })
        .then(() => {
            return queryInterface.addColumn("BoardGames", "max_players", {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: null
            })
        .then(() => {
            return queryInterface.addColumn("BoardGames", "min_playing_time", {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: null
            })
        .then(() => {
            return queryInterface.addColumn("BoardGames", "max_playing_time", {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: null
            })
        .then(() => {
            return queryInterface.addColumn("BoardGames", "playing_time", {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: null
            })
        .then(() => {
            return queryInterface.addColumn("BoardGames", "thumbnail", {
              type: Sequelize.STRING,
              allowNull: true,
              defaultValue: null
            })
        .then(() => {
            return queryInterface.addColumn("BoardGames", "image", {
              type: Sequelize.STRING,
              allowNull: true,
              defaultValue: null
            })
        .then(function() {
            return queryInterface.addColumn("BoardGames", "description", {
              type: Sequelize.TEXT,
              allowNull: true,
              defaultValue: null
            })
        .then(function() {
            return queryInterface.addColumn("BoardGames", "year_published", {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: null
            })
        .then(function() {
            return queryInterface.addColumn("BoardGames", "category", {
              type: Sequelize.STRING,
              allowNull: true,
              defaultValue: null
            })
        .then(function() {
            return queryInterface.addColumn("BoardGames", "mechanic", {
              type: Sequelize.STRING,
              allowNull: true,
              defaultValue: null
            })
        .then(function() {
            return queryInterface.addColumn("BoardGames", "family", {
              type: Sequelize.STRING,
              allowNull: true,
              defaultValue: null
            });
        });});});});});});});});});});});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("BoardGames", "min_players") .then(() => {
            return queryInterface.removeColumn("BoardGames", "max_players").then(() => {
            return queryInterface.removeColumn("BoardGames", "min_playing_time").then(() => {
            return queryInterface.removeColumn("BoardGames", "max_playing_time").then(() => {
            return queryInterface.removeColumn("BoardGames", "playing_time").then(() => {
            return queryInterface.removeColumn("BoardGames", "thumbnail").then(() => {
            return queryInterface.removeColumn("BoardGames", "image").then(() => {
            return queryInterface.removeColumn("BoardGames", "description").then(() => {
            return queryInterface.removeColumn("BoardGames", "year_published").then(() => {
            return queryInterface.removeColumn("BoardGames", "category").then(() => {
            return queryInterface.removeColumn("BoardGames", "mechanic").then(() => {
                return queryInterface.removeColumn("BoardGames", "family");
          });});});});});});});});});});});
  }
};
