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
          as: "event"
      });
      models.ProvidedBoardGame.belongsTo(models.User, {
          onDelete: "CASCADE",
          foreignKey: "id_user",
          as: "user"
      });
      models.ProvidedBoardGame.belongsTo(models.BoardGame, {
          onDelete: "CASCADE",
          foreignKey: "id_board_game",
          as: "board_game"
      });
  };
  return ProvidedBoardGame;
};