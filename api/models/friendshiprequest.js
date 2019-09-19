'use strict';
module.exports = (sequelize, DataTypes) => {
    let FriendshipRequest = sequelize.define('FriendshipRequest', {
        id_user_from: { type: DataTypes.INTEGER },
        id_user_to: { type: DataTypes.INTEGER },
        status: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ["ACCEPTED", "REJECTED", "PENDING"],
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

    FriendshipRequest.STATUS_ACCEPTED = "ACCEPTED";
    FriendshipRequest.STATUS_REJECTED = "REJECTED";
    FriendshipRequest.STATUS_PENDING = "PENDING";
    FriendshipRequest.STATUSES = [
        FriendshipRequest.STATUS_ACCEPTED,
        FriendshipRequest.STATUS_REJECTED,
        FriendshipRequest.STATUS_PENDING
    ];

    return FriendshipRequest;
};