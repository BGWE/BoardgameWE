'use strict';
module.exports = (sequelize, DataTypes) => {
  const BoardGame = sequelize.import("BoardGame");
  var Game = sequelize.define('Game', {
    id_board_game: {
        type: Sequelize.INTEGER,
        references: {
            model: BoardGame,
            key: 'id',
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
    },
    duration: {
        type: DataTypes.INTEGER,
        min: 0
    }
  }, {});
  Game.associate = function(models) {
    // associations can be defined here
  };
  return Game;
};