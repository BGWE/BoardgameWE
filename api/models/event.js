'use strict';
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    name: DataTypes.STRING,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    description: DataTypes.TEXT,
    location: DataTypes.STRING,
    id_creator: DataTypes.INTEGER
  }, {});
  Event.associate = function(models) {
      models.Event.belongsTo(models.User, {
        foreignKey: 'id_creator',
        as: 'creator'
      });
      models.Event.hasMany(models.ProvidedBoardGame, {
          onDelete: "CASCADE",
          foreignKey: 'id_event'
      });
  };
  return Event;
};