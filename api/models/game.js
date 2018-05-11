'use strict';
module.exports = (sequelize, DataTypes) => {
  var Game = sequelize.define('Game', {
    duration: {
        type: DataTypes.INTEGER,
        validate: {min: 0},
        allowNull: true
    },
    id_board_game: {
        type: DataTypes.INTEGER
    }
  }, {});

  Game.associate = function(models) {
      // models.Game.hasOne(models.BoardGame, {
      //     foreignKey: "id",
      //     sourceKey: "id_board_game"  // supported in only from version 5.0.0.beta5
      // });
      models.Game.hasMany(models.GamePlayer, {
          onDelete: "CASCADE",
          foreignKey: "id_game",
          sourceKey: "id",
          as: "players"
      });
  };
  return Game;
};