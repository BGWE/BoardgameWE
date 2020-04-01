'use strict';
module.exports = (sequelize, DataTypes) => {
  var GamePlayer = sequelize.define('GamePlayer', {
    score: {
        type: DataTypes.INTEGER,
        validate: {min: 0}
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: 'game_player_unique'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_game: {
        type: DataTypes.INTEGER,
        unique: 'game_player_unique'
    }
  }, {});
  GamePlayer.associate = function(models) {
      models.GamePlayer.belongsTo(models.User, {
          onDelete: "RESTRICT",
          foreignKey: "id_user",
          as: "user"
      });
      models.GamePlayer.belongsTo(models.Game, {
          onDelete: "CASCADE",
          foreignKey: "id_game",
          as: "game"
      });
  };
  return GamePlayer;
};