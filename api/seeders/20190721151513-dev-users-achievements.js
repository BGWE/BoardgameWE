'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const timeData = {
      createdAt: Sequelize.literal("(now() at time zone 'utc')"),
      updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    };
    return queryInterface.bulkInsert('UserAchievements', [
      { id_user: 1, id_achievement: 'GAM_B_00_WON', ...timeData},
      { id_user: 1, id_achievement: 'GAM_B_00_LOST', ...timeData},
      { id_user: 1, id_achievement: 'GAM_B_01_WON', ...timeData},
      { id_user: 1, id_achievement: 'GAM_B_02_WON', ...timeData},
      { id_user: 2, id_achievement: 'GAM_B_00_WON', ...timeData},
      { id_user: 2, id_achievement: 'GAM_B_01_WON', ...timeData}
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('UserAchievements', null, {});
  }
};
