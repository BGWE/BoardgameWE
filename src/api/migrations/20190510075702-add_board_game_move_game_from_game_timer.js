'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.addColumn('GameTimers', 'id_board_game', {
          type: Sequelize.INTEGER,
          onDelete: "RESTRICT",
          allowNull: true,
          defaultValue: null,
          references: {
            model: 'BoardGames',
            key: 'id'
          }
        }, { transaction }),
        queryInterface.addColumn('GameTimers', 'id_event', {
          type: Sequelize.INTEGER,
          onDelete: "RESTRICT",
          allowNull: true,
          defaultValue: null,
          references: {
            model: 'Events',
            key: 'id'
          }
        }, { transaction }),
        queryInterface.removeColumn('GameTimers', 'id_game', { transaction }),
        queryInterface.addColumn('Games', 'id_timer', {
          type: Sequelize.INTEGER,
          onDelete: "SET NULL",
          defaultValue: null,
          allowNull: true,
          references: {
            model: 'GameTimers',
            key: 'id'
          }
        }, { transaction })
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.removeColumn('GameTimers', 'id_board_game', { transaction }),
        queryInterface.removeColumn('GameTimers', 'id_event', { transaction }),
        queryInterface.addColumn('GameTimers', 'id_game', {
          type: Sequelize.INTEGER,
          allowNull: true,
          foreignKey: {table: "Games", key: "id"},
          unique: true  // one timer per game
        }, { transaction }),
        queryInterface.removeColumn('Games', 'id_timer', { transaction })
      ]);
    });
  }
};
