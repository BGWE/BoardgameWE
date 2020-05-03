'use strict';
module.exports = (sequelize, DataTypes) => {
  const EventAttendee = sequelize.define('EventAttendee', {
    id_event: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_user: {
        type: DataTypes.INTEGER,
        primaryKey: true
    }
  }, {});
  EventAttendee.associate = function(models) {
    models.EventAttendee.belongsTo(models.User, {
      onDelete: "RESTRICT",
      foreignKey: "id_user",
      as: "user"
    });
    models.EventAttendee.belongsTo(models.Event, {
      onDelete: "RESTRICT",
      foreignKey: "id_event",
      as: "event"
    });
  };
  return EventAttendee;
};