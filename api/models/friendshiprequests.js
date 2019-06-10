'use strict';
module.exports = (sequelize, DataTypes) => {
    let FriendshipRequest = sequelize.define('FriendshipRequest', {
        id_user_from: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        id_user_to: {
            type: DataTypes.INTEGER,
            primaryKey: true
        }
    }, {});
    FriendshipRequest.associate = function(models) {
        models.FriendshipRequest.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user_from",
            as: "user_from"
        });

        models.FriendshipRequest.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user_to",
            as: "user_to"
        });
    };
    return FriendshipRequest;
};