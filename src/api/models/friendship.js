'use strict';
module.exports = (sequelize, DataTypes) => {
    /**
     * Friend graph is undirected: u1 and u2 are friends if this table contains either entry
     * (id_user1=u1, id_user2=u2) or (id_user1=u2, id_user2=u1). Table must only contain one of the two possibilities.
     */
    let Friendship = sequelize.define('Friendship', {
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
            where: { [sequelize.Sequelize.Op.or]: [
                { [sequelize.Sequelize.Op.and]: [ {id_user1: uid1}, {id_user2: uid2} ]},
                { [sequelize.Sequelize.Op.and]: [ {id_user1: uid2}, {id_user2: uid1} ]}
            ]}
        });
    };

  Friendship.getFriendIds = async (users) => {
    const fetched = await Friendship.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {id_user1: {[sequelize.Sequelize.Op.in]: users}},
          {id_user2: {[sequelize.Sequelize.Op.in]: users}}
        ]
      }
    });

    const base_users = new Set(users);
    const friends = [];
    fetched.forEach(f => {
      if (!base_users.has(f.id_user1)) {
        friends.push(f.id_user1);
      }
      if (!base_users.has(f.id_user2)) {
        friends.push(f.id_user2);
      }
    });

    return friends;
  };

    return Friendship;
};