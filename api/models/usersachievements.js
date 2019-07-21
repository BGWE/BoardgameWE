'use strict';
module.exports = (sequelize, DataTypes) => {
  const UsersAchievements = sequelize.define('UsersAchievements', {
    id_achievement: DataTypes.STRING,
  }, {});
  UsersAchievements.associate = function(models) {
    models.UsersAchievements.belongsTo(models.User, {
      onDelete: "CASCADE",
      foreignKey: 'id_user',
      targetKey: 'id'
    });
  };
  return UsersAchievements;
};