'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.changeColumn('Events', 'end', { type: Sequelize.DATE }),
            queryInterface.changeColumn('Events', 'start', { type: Sequelize.DATE })
        ]);
    },
    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.changeColumn('Events', 'end', { type: Sequelize.DATEONLY }),
            queryInterface.changeColumn('Events', 'start', { type: Sequelize.DATEONLY })
        ]);
    }
};
