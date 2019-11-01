'use strict';

module.exports = (sequelize, DataTypes) => {
  let PlayedExpansion = sequelize.define('PlayedExpansion', {
    id_board_game: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_game: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  }, {});
  PlayedExpansion.associate = function(models) {
    models.PlayedExpansion.belongsTo(models.Game, {
      onDelete: "CASCADE",
      foreignKey: "id_game",
      as: "game"
    });
    models.PlayedExpansion.belongsTo(models.BoardGame, {
      onDelete: "RESTRICT",
      foreignKey: "id_board_game",
      as: "board_game"
    });
  };
  return PlayedExpansion;
};