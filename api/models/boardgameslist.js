'use strict';
module.exports = (sequelize, DataTypes) => {
    const BoardGamesList = sequelize.define('BoardGamesList', {
        name: DataTypes.STRING
    }, {});

    BoardGamesList.associate = function(models) {
        models.BoardGamesList.hasMany(models.Challenge, {
            onDelete: "CASCADE",
            foreignKey: 'id_board_games_list',
            sourceKey: 'id',
            as: 'challenge'
        });

        models.BoardGamesList.hasMany(models.BoardGamesListItem, {
            onDelete: "CASCADE",
            foreignKey: 'id_board_games_list',
            sourceKey: 'id',
            as: 'board_games_list_item'
        });
    };

    return BoardGamesList;
};