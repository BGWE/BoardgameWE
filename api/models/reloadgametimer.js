'use strict';
module.exports = (sequelize, DataTypes) => {
  const ReloadGameTimer = sequelize.define('ReloadGameTimer', {
    timer_type: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ["RELOAD"],
    },
    duration_increment: DataTypes.BIGINT // in ms
  }, {});
  ReloadGameTimer.associate = function(models) {
    models.ReloadGameTimer.hasOne(models.GameTimer, {
      targetKey: 'id',
      foreignKey: 'id',
      as: 'timer'
    });
  };
  return ReloadGameTimer;
};