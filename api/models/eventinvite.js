'use strict';
module.exports = (sequelize, DataTypes) => {
    let EventInvite = sequelize.define('EventInvite', {
        id_inviter: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        id_invitee: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        status: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ["ACCEPTED", "REJECTED", "PENDING"],
        }
    }, {});
    EventInvite.associate = function(models) {
        models.EventInvite.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_inviter",
            as: "inviter"
        });

        models.EventInvite.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_invitee",
            as: "invitee"
        });
    };

    EventInvite.STATUS_ACCEPTED = "ACCEPTED";
    EventInvite.STATUS_REJECTED = "REJECTED";
    EventInvite.STATUS_PENDING = "PENDING";

    return EventInvite;
};