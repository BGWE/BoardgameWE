'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('WishToPlayBoardGames', {
            id_board_game: {
                type: Sequelize.INTEGER
            },
            id_user: {
                type: Sequelize.INTEGER
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }).then(() => {
            return queryInterface.addConstraint('WishToPlayBoardGames', ['id_user', 'id_board_game'], {
                type: 'primary key',
                name: 'wish_to_play_board_game_pkey'
            });
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('WishToPlayBoardGames');
    }
};