'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("FriendshipRequests", "status", {
            type: Sequelize.ENUM("ACCEPTED", "REJECTED", "PENDING"),
            allowNull: false,
            defaultValue: "PENDING"
        });
    },

    down: (queryInterface) => {
        return Promise.all([
            queryInterface.removeColumn("FriendshipRequests", "status"),
            queryInterface.query("DROP TYPE IF EXISTS enum_FriendshipRequests_status RESTRICT")
        ]);
    }
};


