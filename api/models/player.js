'use strict';
module.exports = (sequelize, DataTypes) => {
  var Player = sequelize.define('Player', {
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: {isEmail: true}
    }
  }, {});
  Player.associate = function(models) {
    // associations can be defined here
  };
  return Player;
};