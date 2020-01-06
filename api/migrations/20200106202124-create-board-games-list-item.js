'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('BoardGamesListItems', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            id_board_game: {
                type: Sequelize.STRING,
                onDelete: "RESTRICT",
                allowNull: false,
                references: {
                    model: 'BoardGames',
                    key: 'id'
                }
            },
            id_board_games_list: {
                type: Sequelize.STRING,
                onDelete: "RESTRICT",
                allowNull: false,
                references: {
                    model: 'BoardGamesList',
                    key: 'id'
                }
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
        return queryInterface.dropTable('BoardGamesListItems');
    }
};