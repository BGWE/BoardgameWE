'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserAchievement = sequelize.define('UserAchievement', {
    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_achievement: {
      type: DataTypes.STRING,
      primaryKey: true
    }
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