'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.bulkInsert('UsersAchievements', [{
        id_user: 1,
        id_achievement: 'a.events.victories',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
        id_user: 1,
        id_achievement: 'a.events.losses',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
        id_user: 1,
        id_achievement: 'a.games.victories.0',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
        id_user: 1,
        id_achievement: 'a.games.victories.1',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
        id_user: 2,
        id_achievement: 'a.events.victories',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
        id_user: 2,
        id_achievement: 'a.games.victories.0',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('UsersAchievements', null, {});
  }
};
