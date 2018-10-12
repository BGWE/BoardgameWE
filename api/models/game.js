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
    },
    id_event: {
        type: DataTypes.INTEGER
    },
    ranking_method: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: ["WIN_LOSE", "POINTS_HIGHER_BETTER", "POINTS_LOWER_BETTER"],

    }
  }, {});

  Game.associate = function(models) {
      models.Game.hasMany(models.GamePlayer, {
          onDelete: "CASCADE",
          foreignKey: "id_game",
          sourceKey: "id",
          as: "players"
      });

      models.Game.belongsTo(models.Event, {
          onDelete: "RESTRICT",
          foreignKey: "id_event",
          targetKey: "id",
          as: "event"
      });
  };
  return Game;
};