'use strict';
const bcrypt = require("bcryptjs");
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    name: DataTypes.STRING,
    surname: DataTypes.STRING,
    password: DataTypes.STRING,
    admin: DataTypes.BOOLEAN,
    valid: {
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
    // associations can be defined here
  };

  User.prototype.validPassword = function (password) {
      return bcrypt.compare(password, this.password);
  };

  return User;
};