'use strict';
module.exports = (sequelize, DataTypes) => {
  const PlayerGameTimer = sequelize.define('PlayerGameTimer', {
    id_timer: DataTypes.INTEGER,
    id_user: DataTypes.INTEGER,
    name: DataTypes.STRING,
    color: DataTypes.STRING,
    elapsed: DataTypes.BIGINT,  // in ms
    start: DataTypes.DATE
  }, {});
  PlayerGameTimer.associate = function(models) {
    models.PlayerGameTimer.belongsTo(models.GameTimer, {
      onDelete: "CASCADE",
      foreignKey: "id_timer",
      as: "timer"
    });
    models.PlayerGameTimer.belongsTo(models.User, {
      onDelete: "CASCADE",
      foreignKey: "id_user",
      as: "user"
    });
  };
  return PlayerGameTimer;
};