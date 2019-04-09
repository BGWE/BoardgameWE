'use strict';
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    name: DataTypes.STRING,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    description: DataTypes.TEXT,
    location: DataTypes.STRING,
    id_creator: DataTypes.INTEGER,
    hide_rankings: DataTypes.BOOLEAN
  }, {});
  Event.associate = function(models) {
      models.Event.belongsTo(models.User, {
        foreignKey: 'id_creator',
        sourceKey: 'id',
        as: 'creator'
      });
      models.Event.hasMany(models.Game, {
          onDelete: "CASCADE",
          foreignKey: 'id_event',
          sourceKey: 'id',
          as: 'games'
      });
      models.Event.hasMany(models.ProvidedBoardGame, {
          onDelete: "CASCADE",
          foreignKey: 'id_event',
          sourceKey: 'id',
          as: 'provided_board_games'
      });
      models.Event.hasMany(models.EventAttendee, {
          onDelete: "CASCADE",
          foreignKey: 'id_event',
          sourceKey: 'id',
          as: 'attendees'
      });
  };
  return Event;
};