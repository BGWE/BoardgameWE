'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.addConstraint('BoardGames', ['bgg_id'], {
          type: 'unique',
          name: 'bgg_id_unique'
      });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.removeConstraint('BoardGames', "bgg_id_unique");
  }
};
