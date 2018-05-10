'use strict';
module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.import("Game");
  const Player = sequelize.import("Player");
  var GamePlayer = sequelize.define('GamePlayer', {
    id_player: {
        type: Sequelize.INTEGER,
        references: {
            model: Player,
            key: 'id',
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
    },
    id_game: {
        type: Sequelize.INTEGER,
        references: {
            model: Game,
            key: 'id',
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
    },
    rank: DataTypes.INTEGER
  }, {});
  GamePlayer.associate = function(models) {
    // associations can be defined here
  };
  return GamePlayer;
};