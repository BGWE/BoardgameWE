'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GameTimers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_game: {
        type: Sequelize.INTEGER,
        allowNull: true,
        foreignKey: {table: "Games", key: "id"},
        unique: true  // one timer per game
      },
      id_creator: {
        type: Sequelize.INTEGER,
        foreignKey: {table: "Users", key: "id"}
      },
      initial_duration: {
        type: Sequelize.BIGINT, // in ms
        defaultValue: 0
      },
      timer_type: {
        allowNull: false,
        type: Sequelize.ENUM("COUNT_UP", "COUNT_DOWN", "RELOAD"),
        defaultValue: "COUNT_UP"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(c => {
      return queryInterface.addConstraint('GameTimers', ['id', 'timer_type'], {
        type: 'unique',
        name: 'game_timers_unique_pair_id_type'
      });
    });
  },
  down: (queryInterface, Sequelize) => {
      return Promise.all([
        queryInterface.dropTable('GameTimers'),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_GameTimers_timer_type\" RESTRICT")
      ]);
  }
};