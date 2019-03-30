'use strict';
module.exports = (sequelize, DataTypes) => {
  const ReloadGameTimer = sequelize.define('ReloadGameTimer', {
    id_timer: DataTypes.INTEGER,
    timer_type: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ["RELOAD"],
    },
    increment: DataTypes.BIGINT // in ms
  }, {});
  ReloadGameTimer.associate = function(models) {
    // associations can be defined here
  };
  return ReloadGameTimer;
};