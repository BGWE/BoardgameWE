'use strict';
module.exports = (sequelize, DataTypes) => {
    let EventJoinRequest = sequelize.define('EventJoinRequest', {
        id_event: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        id_requester: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        status: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ["ACCEPTED", "REJECTED", "PENDING"],
        }
    }, {});
    EventJoinRequest.associate = function(models) {
        models.EventJoinRequest.belongsTo(models.Event, {
            onDelete: "CASCADE",
            foreignKey: "id_event",
            as: "event"
        });
        models.EventJoinRequest.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_requester",
            as: "requester"
        });
    };

    EventJoinRequest.STATUS_ACCEPTED = "ACCEPTED";
    EventJoinRequest.STATUS_REJECTED = "REJECTED";
    EventJoinRequest.STATUS_PENDING = "PENDING";
    EventJoinRequest.STATUSES = [
        EventJoinRequest.STATUS_ACCEPTED,
        EventJoinRequest.STATUS_REJECTED,
        EventJoinRequest.STATUS_PENDING
    ];

    return EventJoinRequest;
};