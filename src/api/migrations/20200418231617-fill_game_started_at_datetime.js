'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate("Games", {
      "started_at": Sequelize.literal('"createdAt" - make_interval(mins := "duration")')
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate("Games", { "started_at": null });
  }
};
