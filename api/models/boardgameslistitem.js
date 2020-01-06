'use strict';
module.exports = (sequelize, DataTypes) => {
    let BoardGamesListItem = sequelize.define('BoardGamesListItem', {
        id_board_games_list: {
            type: DataTypes.INTEGER
        },
        id_board_game: {
            type: DataTypes.INTEGER
        },
    }, {});

    BoardGamesListItem.associate = function(models) {
        models.BoardGamesListItem.belongsTo(models.BoardGamesList, {
            as: "board_games_list",
            foreignKey: "id_board_games_list",
            targetKey: "id",
            onDelete: "RESTRICT"
        });

        models.BoardGamesListItem.belongsTo(models.BoardGame, {
            as: "board_game",
            foreignKey: "id_board_game",
            targetKey: "id",
            onDelete: "RESTRICT"
        });
    };

    return BoardGamesListItem;
};