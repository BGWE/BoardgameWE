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
    // associations can be defined here
  };
  return PlayerGameTimer;
};