'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const timeData = {
      createdAt: Sequelize.literal("(now() at time zone 'utc')"),
      updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    };
    return queryInterface.bulkInsert('UsersAchievements', [
      { id_user: 1, id_achievement: 'a.events.victories', ...timeData},
      { id_user: 1, id_achievement: 'a.events.losses', ...timeData},
      { id_user: 1, id_achievement: 'a.games.victories.0', ...timeData},
      { id_user: 1, id_achievement: 'a.games.victories.1', ...timeData},
      { id_user: 2, id_achievement: 'a.events.victories', ...timeData},
      { id_user: 2, id_achievement: 'a.games.victories.0', ...timeData}
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('UsersAchievements', null, {});
  }
};
