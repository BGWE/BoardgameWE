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
            as: "user1"
        });
        models.Friendship.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: "id_user2",
            as: "user2"
        });
    };

    /**
     * Check whether users with uid1 and uid2 are friends.
     * @param uid1 Number First user id
     * @param uid2 Number Second user id
     * @returns {Promise<number>} Returns 1 if they are friends, 0 otherwise
     */
    Friendship.areFriends = async function(uid1, uid2) {
        return await Friendship.count({
            where: { [sequelize.Op.or]: [
                { [sequelize.Op.and]: [ {id_user1: uid1}, {id_user2: uid2} ]},
                { [sequelize.Op.and]: [ {id_user1: uid2}, {id_user2: uid1} ]}
            ]}
        });
    };

    return Friendship;
};