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

  const Game = sequelize.import("./game");
  const Player = sequelize.import("./player");
  GamePlayer.belongsTo(Player, {
    onDelete: "CASCADE",
    foreignKey: "id_player"
  });

  GamePlayer.belongsTo(Game, {
    onDelete: "CASCADE",
    foreignKey: "id_game"
  });

  return GamePlayer;
};