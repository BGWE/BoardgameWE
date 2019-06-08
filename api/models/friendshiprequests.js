'use strict';
module.exports = (sequelize, DataTypes) => {
    let FriendshipRequest = sequelize.define('FriendshipRequests', {
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
            as: "user"
        });

        models.FriendshipRequest.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user_to",
            as: "user"
        });
    };
    return FriendshipRequest;
};