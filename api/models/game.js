'use strict';
module.exports = (sequelize, DataTypes) => {
    let Game = sequelize.define('Game', {
        duration: { // in minutes
            type: DataTypes.INTEGER,
            validate: { min: 0 },
            allowNull: true
        },
        id_board_game: {
            type: DataTypes.INTEGER
        },
        id_event: {
            type: DataTypes.INTEGER
        },
        ranking_method: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ["WIN_LOSE", "POINTS_HIGHER_BETTER", "POINTS_LOWER_BETTER"],
        },
        id_timer: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {});

    Game.associate = function(models) {
        models.Game.hasMany(models.GamePlayer, {
            onDelete: "CASCADE",
            foreignKey: "id_game",
            sourceKey: "id",
            as: "game_players"
        });

        models.Game.hasMany(models.PlayedExpansion, {
            onDelete: "CASCADE",
            foreignKey: "id_game",
            sourceKey: "id",
            as: "expansions"
        });

        models.Game.belongsTo(models.Event, {
            onDelete: "RESTRICT",
            foreignKey: "id_event",
            targetKey: "id",
            as: "event"
        });

        models.Game.belongsTo(models.BoardGame, {
            as: "board_game",
            foreignKey: "id_board_game",
            targetKey: "id",
            onDelete: "RESTRICT"
        });

        models.Game.belongsTo(models.GameTimer, {
            foreignKey: 'id_timer',
            sourceKey: 'id',
            as: 'timer'
        });
    };

    Game.RANKING_LOWER_BETTER = "POINTS_LOWER_BETTER";
    Game.RANKING_HIGHER_BETTER = "POINTS_HIGHER_BETTER";
    Game.RANKING_WIN_LOSE = "WIN_LOSE";
    return Game;
};