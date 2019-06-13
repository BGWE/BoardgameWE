'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("Events", "user_can_join", {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
    },

    down: (queryInterface) => {
        return queryInterface.removeColumn("Events", "user_can_join");
    }
};


