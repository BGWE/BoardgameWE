'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    let now = Sequelize.literal("(now() at time zone 'utc')");
    return Promise.all([
        queryInterface.bulkInsert("EventAttendees", [
            {id_event: 1, id_user: 1, createdAt: now, updatedAt: now},
            {id_event: 2, id_user: 1, createdAt: now, updatedAt: now},
            {id_event: 1, id_user: 2, createdAt: now, updatedAt: now}
        ]),
        queryInterface.bulkInsert("ProvidedBoardGames", [
            {id_event: 1, id_user: 1, id_board_game: 1, createdAt: now, updatedAt: now},
            {id_event: 1, id_user: 2, id_board_game: 2, createdAt: now, updatedAt: now},
            {id_event: 1, id_user: 2, id_board_game: 3, createdAt: now, updatedAt: now},
            {id_event: 1, id_user: 1, id_board_game: 3, createdAt: now, updatedAt: now},
            {id_event: 2, id_user: 1, id_board_game: 1, createdAt: now, updatedAt: now}
        ])
      ])
  },

  down: (queryInterface, Sequelize) => {
      return Promise.all([
          queryInterface.bulkDelete('EventAttendees', null, {}),
          queryInterface.bulkDelete('ProvidedBoardGames', null, {})
      ])
  }
};