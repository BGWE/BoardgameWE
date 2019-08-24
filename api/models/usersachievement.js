'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserAchievement = sequelize.define('UserAchievement', {
    id_user: DataTypes.INTEGER,
    id_achievement: DataTypes.STRING
  }, {});
  UserAchievement.associate = function(models) {
    models.UserAchievement.belongsTo(models.User, {
      onDelete: "CASCADE",
      foreignKey: 'id_user',
      targetKey: 'id'
    });
  };
  return UserAchievement;
};