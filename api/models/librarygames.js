'use strict';
module.exports = (sequelize, DataTypes) => {
    var LibraryGame = sequelize.define('LibraryGame', {
        id_user: {
            type: DataTypes.INTEGER
        },
        id_board_game: {
            type: DataTypes.INTEGER
        }
    }, {});
    LibraryGame.associate = function(models) {
        models.LibraryGame.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user",
            as: "user"
        });

        models.LibraryGame.belongsTo(models.BoardGame, {
            onDelete: "CASCADE",
            foreignKey: "id_board_game",
            as: "board_game"
        });
    };
    return LibraryGame;
};