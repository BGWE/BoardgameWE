'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProvidedBoardGame = sequelize.define('ProvidedBoardGame', {
    id_board_game: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_event: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  }, {});
  ProvidedBoardGame.associate = function(models) {
      models.ProvidedBoardGame.belongsTo(models.Event, {
          onDelete: "CASCADE",
          foreignKey: "id_event",
          targetKey: "id",
          as: "event"
      });
      models.ProvidedBoardGame.belongsTo(models.User, {
          onDelete: "CASCADE",
          foreignKey: "id_user",
          targetKey: "id",
          as: "provider"
      });
      models.ProvidedBoardGame.belongsTo(models.BoardGame, {
          onDelete: "CASCADE",
          foreignKey: "id_board_game",
          targetKey: "id",
          as: "provided_board_game"
      });
  };
  return ProvidedBoardGame;
};