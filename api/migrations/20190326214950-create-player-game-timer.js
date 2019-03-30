'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('PlayerGameTimers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_timer: {
        type: Sequelize.INTEGER,
        foreignKey: {table: "GameTimers", key: "id"}
      },
      id_user: {
        type: Sequelize.INTEGER,
        allowNull: true,
        foreignKey: {table: "Users", key: "id"}
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: "#ffffff"
      },
      elapsed: {
        type: Sequelize.BIGINT // in ms
      },
      start: {
        type: Sequelize.DATE,
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
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('PlayerGameTimers');
  }
};