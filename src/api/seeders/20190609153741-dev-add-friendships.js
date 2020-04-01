'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      const timeData = {
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      };
      return queryInterface.bulkInsert('Friendships', [
          { id_user1: 1, id_user2: 2, ...timeData },
          { id_user1: 1, id_user2: 4, ...timeData },
          { id_user1: 2, id_user2: 4, ...timeData },
          { id_user1: 4, id_user2: 5, ...timeData }
       ], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Friendships', null, {});
  }
};
