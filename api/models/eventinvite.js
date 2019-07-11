'use strict';
module.exports = (sequelize, DataTypes) => {
    let EventInvite = sequelize.define('EventInvite', {
        id_event: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        id_inviter: {
            type: DataTypes.INTEGER,
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
        models.EventInvite.belongsTo(models.Event, {
            onDelete: "CASCADE",
            foreignKey: "id_event",
            as: "event"
        });

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
    EventInvite.STATUSES = [
        EventInvite.STATUS_ACCEPTED,
        EventInvite.STATUS_REJECTED,
        EventInvite.STATUS_PENDING
    ];

    return EventInvite;
};