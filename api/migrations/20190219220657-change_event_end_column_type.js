'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.changeColumn('Events', 'end', { type: Sequelize.DATEONLY });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.changeColumn('Events', 'end', { type: Sequelize.DATE });
    }
};
