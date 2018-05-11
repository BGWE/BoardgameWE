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
      models.Player.hasMany(models.GamePlayer, {
          onDelete: "CASCADE",
          foreignKey: "id_player"
      })
  };
  return Player;
};