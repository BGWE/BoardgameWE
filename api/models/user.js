'use strict';
const bcrypt = require("bcryptjs");
module.exports = (sequelize, DataTypes) => {
  let User = sequelize.define('User', {
    name: DataTypes.STRING,
    surname: DataTypes.STRING,
    password: DataTypes.STRING,
    admin: DataTypes.BOOLEAN,
    validated: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true
    }
  }, {});

  User.associate = function(models) {
      models.User.hasMany(models.Friendship, {
          onDelete: "CASCADE",
          foreignKey: 'id_user1',
          sourceKey: 'id',
          as: 'friend1'
      });
      models.User.hasMany(models.Friendship, {
          onDelete: "CASCADE",
          foreignKey: 'id_user2',
          sourceKey: 'id',
          as: 'friend2'
      });
      models.User.hasMany(models.FriendshipRequest, {
          onDelete: "CASCADE",
          foreignKey: 'id_user_from',
          sourceKey: 'id',
          as: 'request_user_from'
      });
      models.User.hasMany(models.FriendshipRequest, {
          onDelete: "CASCADE",
          foreignKey: 'id_user_to',
          sourceKey: 'id',
          as: 'request_user_to'
      });
      models.User.hasMany(models.UserAchievements, {
          onDelete: "CASCADE",
          foreignKey: 'id_user',
          sourceKey: 'id',
          as: 'user'
      });
  };

  User.prototype.validPassword = function (password) {
      return bcrypt.compare(password, this.password);
  };

  return User;
};