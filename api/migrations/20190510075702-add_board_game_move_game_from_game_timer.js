'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
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
            }),
            queryInterface.addColumn('GameTimers', 'id_event', {
                type: Sequelize.INTEGER,
                onDelete: "RESTRICT",
                allowNull: true,
                defaultValue: null,
                references: {
                    model: 'Events',
                    key: 'id'
                }
            }),
            queryInterface.removeColumn('GameTimers', 'id_game'),
            queryInterface.addColumn('Games', 'id_timer', {
                type: Sequelize.INTEGER,
                onDelete: "SET NULL",
                defaultValue: null,
                allowNull: true,
                references: {
                    model: 'GameTimers',
                    key: 'id'
                }
            })
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('GameTimers', 'id_board_game'),
            queryInterface.removeColumn('GameTimers', 'id_event'),
            queryInterface.addColumn('GameTimers', 'id_game', {
                type: Sequelize.INTEGER,
                allowNull: true,
                foreignKey: {table: "Games", key: "id"},
                unique: true  // one timer per game
            }),
            queryInterface.removeColumn('Games', 'id_timer')
        ]);
    }
};
