'use strict';
module.exports = (sequelize, DataTypes) => {
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