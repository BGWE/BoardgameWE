'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserAchievements = sequelize.define('UserAchievements', {
    id_achievement: DataTypes.STRING,
  }, {});
  UserAchievements.associate = function(models) {
    models.UserAchievements.belongsTo(models.User, {
      onDelete: "CASCADE",
      foreignKey: 'id_user',
      sourceKey: 'id',
      as: 'user'
    });
  };
  return UserAchievements;
};