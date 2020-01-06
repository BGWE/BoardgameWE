'use strict';
module.exports = (sequelize, DataTypes) => {
    let Challenge = sequelize.define('Challenge', {
        n_games: { // how many plays per bg_set
            type: DataTypes.INTEGER,
            validate: { min: 1 },
            allowNull: false
        },
        id_board_games_list: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {});

    Challenge.associate = function(models) {
        models.Challenge.belongsTo(models.BoardGamesList, {
            onDelete: "CASCADE",
            foreignKey: "id_board_games_list",
            sourceKey: "id",
            as: "board_games_list"
        });
    };

    return Challenge;
};