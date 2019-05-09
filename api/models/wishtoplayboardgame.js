'use strict';
module.exports = (sequelize, DataTypes) => {
    const WishToPlayBoardGame = sequelize.define('WishToPlayBoardGame', {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        id_board_game: {
            type: DataTypes.INTEGER,
            primaryKey: true
        }
    }, {});
    WishToPlayBoardGame.associate = function(models) {
        models.WishToPlayBoardGame.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user",
            as: "user"
        });

        models.WishToPlayBoardGame.belongsTo(models.BoardGame, {
            onDelete: "CASCADE",
            foreignKey: "id_board_game",
            as: "board_game"
        });
    };
    return WishToPlayBoardGame;
};