'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    let now = Sequelize.literal("(now() at time zone 'utc')");
    return queryInterface.bulkInsert('Games', [
        {id_board_game: 1, id_event: 1, ranking_method: 'POINTS_HIGHER_BETTER', duration: 120, createdAt: now, updatedAt: now},
        {id_board_game: 1, id_event: 1, ranking_method: 'POINTS_HIGHER_BETTER', duration: 180, createdAt: now, updatedAt: now},
        {id_board_game: 2, id_event: 1, ranking_method: 'WIN_LOSE', duration: 60, createdAt: now, updatedAt: now}
    ]).then(inserted => {
        queryInterface.bulkInsert("GamePlayers", [
            {id_game: 1, id_user: 1, score: 100, name: null, createdAt: now, updatedAt: now},
            {id_game: 1, id_user: 2, score: 10, name: null, createdAt: now, updatedAt: now},
            {id_game: 1, id_user: null, score: 58, name: "john", createdAt: now, updatedAt: now},
            {id_game: 2, id_user: 1, score: 121, name: null, createdAt: now, updatedAt: now},
            {id_game: 2, id_user: 2, score: 133, name: null, createdAt: now, updatedAt: now},
            {id_game: 2, id_user: null, score: 99, name: "patrick", createdAt: now, updatedAt: now},
            {id_game: 3, id_user: 1, score: 0, name: null, createdAt: now, updatedAt: now},
            {id_game: 3, id_user: 2, score: 1, name: null, createdAt: now, updatedAt: now},
        ])
    });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Games', null, {})
          .then(r => {
              return queryInterface.bulkDelete('GamePlayers', null, {})
          });
  }
};
