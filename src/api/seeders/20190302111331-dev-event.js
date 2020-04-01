'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.bulkInsert('Events', [{
          name: "ongoing event",
          start: "2016-01-01T00:00:00Z",
          end: "2025-01-01T00:00:00Z",
          description: "Ongoing event",
          location: "Bruxelles",
          id_creator: 2,
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
          name: "finished event",
          start: "2016-01-01T00:00:00Z",
          end: "2017-01-01T00:00:00Z",
          description: "Finished event",
          location: "Bruxelles",
          id_creator: 2,
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Events', null, {});
  }
};
