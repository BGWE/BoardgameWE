'use strict';
module.exports = (sequelize, DataTypes) => {
    /**
     * Friend graph is undirected: u1 and u2 are friends if this table contains either entry
     * (id_user1=u1, id_user2=u2) or (id_user1=u2, id_user2=u1). Table must only contain one of the two possibilities.
     */
    let Friendship = sequelize.define('Friendships', {
        id_user1: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        id_user2: {
            type: DataTypes.INTEGER,
            primaryKey: true
        }
    }, {});
    Friendship.associate = function(models) {
        models.Friendship.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user1",
            as: "user"
        });

        models.Friendship.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user2",
            as: "user"
        });
    };
    return Friendship;
};