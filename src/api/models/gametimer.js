'use strict';
module.exports = (sequelize, DataTypes) => {
    const GameTimer = sequelize.define('GameTimer', {
        id_board_game: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        id_event: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        id_creator: DataTypes.INTEGER,
        initial_duration: DataTypes.BIGINT, // in ms
        current_player: DataTypes.INTEGER,
        timer_type: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ["COUNT_UP", "COUNT_DOWN", "RELOAD"],
        }
    }, {});
    GameTimer.associate = function(models) {
        models.GameTimer.belongsTo(models.BoardGame, {
            foreignKey: 'id_board_game',
            sourceKey: 'id',
            as: 'board_game'
        });
        models.GameTimer.belongsTo(models.Event, {
            foreignKey: 'id_event',
            sourceKey: 'id',
            as: 'event'
        });
        models.GameTimer.belongsTo(models.User, {
            foreignKey: 'id_creator',
            sourceKey: 'id',
            as: 'creator'
        });
        models.GameTimer.hasMany(models.PlayerGameTimer, {
            onDelete: "CASCADE",
            foreignKey: 'id_timer',
            sourceKey: 'id',
            as: 'player_timers'
        });
        models.GameTimer.hasOne(models.Game, {
            targetKey: 'id',
            foreignKey: 'id_timer',
            as: 'game'
        });
    };
    GameTimer.COUNT_UP = "COUNT_UP";
    GameTimer.COUNT_DOWN = "COUNT_DOWN";
    GameTimer.RELOAD = "RELOAD";
    GameTimer.TYPES = [GameTimer.COUNT_UP, GameTimer.COUNT_DOWN, GameTimer.RELOAD];
    return GameTimer;
};