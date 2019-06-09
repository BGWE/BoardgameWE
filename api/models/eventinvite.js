'use strict';
module.exports = (sequelize, DataTypes) => {
    let EventInvite = sequelize.define('EventInvites', {
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
            values: ["ACCEPTED", "REFUSED", "PENDING"],
        }
    }, {});
    EventInvite.associate = function(models) {
        models.EventInvite.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_inviter",
            as: "user"
        });

        models.EventInvite.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_invitee",
            as: "user"
        });
    };

    EventInvite.STATUS_ACCEPTED = "ACCEPTED";
    EventInvite.STATUS_REFUSED = "REFUSED";
    EventInvite.STATUS_PENDING = "PENDING";

    return EventInvite;
};