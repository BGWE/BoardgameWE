'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    name: DataTypes.STRING,
    surname: DataTypes.STRING,
    password: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: "unique_player_username"
    },
    username: {
      type: DataTypes.STRING,
      unique: "unique_player_username"
    }
  }, {});
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};