'use strict';
module.exports = (sequelize, DataTypes) => {
  let GamePlayer = sequelize.define('PlayedExpansion', {
    id_board_game: {
      type: DataTypes.INTEGER,
      primary_key: true
    },
    id_game: {
      type: DataTypes.INTEGER,
      primary_key: true
    }
  }, {});
  GamePlayer.associate = function(models) {
    models.Game.belongsTo(models.Game, {
      onDelete: "CASCADE",
      foreignKey: "id_game",
      as: "game"
    });
    models.BoardGame.belongsTo(models.BoardGame, {
      onDelete: "RESTRICT",
      foreignKey: "id_board_game",
      as: "board_game"
    });
  };
  return GamePlayer;
};