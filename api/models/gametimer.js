'use strict';
module.exports = (sequelize, DataTypes) => {
  const GameTimer = sequelize.define('GameTimer', {
    id_game: DataTypes.INTEGER,
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
      models.GameTimer.belongsTo(models.Game, {
          foreignKey: 'id_game',
          sourceKey: 'id',
          as: 'game'
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
  };
  GameTimer.COUNT_UP = "COUNT_UP";
  GameTimer.COUNT_DOWN = "COUNT_DOWN";
  GameTimer.RELOAD = "RELOAD";
  GameTimer.TYPES = [GameTimer.COUNT_UP, GameTimer.COUNT_DOWN, GameTimer.RELOAD];
  return GameTimer;
};