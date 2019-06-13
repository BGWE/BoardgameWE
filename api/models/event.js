'use strict';
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    name: DataTypes.STRING,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    description: DataTypes.TEXT,
    location: DataTypes.STRING,
    id_creator: DataTypes.INTEGER,
    hide_rankings: DataTypes.BOOLEAN,
    visibility: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ["PUBLIC", "PRIVATE", "SECRET"],
    },
    attendees_can_edit: DataTypes.BOOLEAN,
    invite_required: DataTypes.BOOLEAN,
    user_can_join: DataTypes.BOOLEAN
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

  Event.VISIBILITY_PUBLIC = "PUBLIC";
  Event.VISIBILITY_PRIVATE = "PRIVATE";
  Event.VISIBILITY_SECRET = "SECRET";
  Event.VISIBILITIES = [Event.VISIBILITY_PUBLIC, Event.VISIBILITY_PRIVATE, Event.VISIBILITY_SECRET];

  return Event;
};