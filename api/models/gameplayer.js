'use strict';
module.exports = (sequelize, DataTypes) => {
  var GamePlayer = sequelize.define('GamePlayer', {
    rank: {
        type: DataTypes.INTEGER,
        validate: {min: 0}
    },
    id_player: {
        type: DataTypes.INTEGER
    },
    id_game: {
        type: DataTypes.INTEGER
    }
  }, {});
  GamePlayer.associate = function(models) {
      models.GamePlayer.belongsTo(models.Player, {
          onDelete: "CASCADE",
          foreignKey: "id_player",
          as: "player"
      });

      models.GamePlayer.belongsTo(models.Game, {
          onDelete: "CASCADE",
          foreignKey: "id_game",
          as: "game"
      });
  };
  return GamePlayer;
};