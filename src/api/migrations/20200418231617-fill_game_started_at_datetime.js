'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.bulkUpdate(
            "Games",
            { "started_at": Sequelize.literal('"createdAt" - make_interval(mins := "duration")'), },
            { "duration": {[Sequelize.Op.ne]: null} }, { transaction }
        ), queryInterface.bulkUpdate(
            "Games",
            { "started_at": queryInterface.sequelize.col("createdAt") },
            { "duration": null }, { transaction }
        )
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate("Games", { "started_at": null });
  }
};
