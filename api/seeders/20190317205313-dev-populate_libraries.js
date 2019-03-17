'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      let now = Sequelize.literal("(now() at time zone 'utc')");
      return queryInterface.bulkInsert("LibraryGames", [
        {id_user: 1, id_board_game: 1, createdAt: now, updatedAt: now},
        {id_user: 1, id_board_game: 2, createdAt: now, updatedAt: now},
        {id_user: 2, id_board_game: 1, createdAt: now, updatedAt: now}
      ]);
  },
  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('LibraryGames', null, {});
  }
};
