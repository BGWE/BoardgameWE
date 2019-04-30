'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        let now = Sequelize.literal("(now() at time zone 'utc')");
        return queryInterface.bulkInsert("GameTimers", [{
            id_game: null, id_creator: 2,
            initial_duration: 0, current_player: 0,
            timer_type: "COUNT_UP",
            createdAt: now, updatedAt: now
        }, {
            id_game: null, id_creator: 2,
            initial_duration: 0, current_player: 0,
            timer_type: "COUNT_DOWN",
            createdAt: now, updatedAt: now
        }, {
            id_game: null, id_creator: 2,
            initial_duration: 0, current_player: 0,
            timer_type: "RELOAD",
            createdAt: now, updatedAt: now
        }]).then(() => {
            return queryInterface.bulkInsert("ReloadGameTimers", [{
                id: 3, timer_type: "RELOAD", duration_increment: 2000,
                createdAt: now, updatedAt: now
            }]).then(() => {
                return queryInterface.bulkInsert("PlayerGameTimers", [
                    {id_timer: 1, id_user: 1, name: null, start: null, elapsed: 0, turn_order: 0, color: "#FFF0F0", createdAt: now, updatedAt: now},
                    {id_timer: 1, id_user: 2, name: null, start: null, elapsed: 0, turn_order: 1, color: "#9F5040", createdAt: now, updatedAt: now},
                    {id_timer: 1, id_user: null, name: "Bob", start: null, elapsed: 0, turn_order: 2, color: "#C000C0", createdAt: now, updatedAt: now},
                    {id_timer: 2, id_user: 1, name: null, start: null, elapsed: 0, turn_order: 0, color: "#0CC0FF", createdAt: now, updatedAt: now},
                    {id_timer: 2, id_user: null, name: "Carlo", start: null, elapsed: 0, turn_order: 1, color: "#55CC55", createdAt: now, updatedAt: now},
                    {id_timer: 2, id_user: 2, name: null, start: null, elapsed: 0, turn_order: 2, color: "#F95C5C", createdAt: now, updatedAt: now},
                    {id_timer: 3, id_user: 1, name: null, start: null, elapsed: 0, turn_order: 0, color: "#40F9CC", createdAt: now, updatedAt: now},
                    {id_timer: 3, id_user: 2, name: null, start: null, elapsed: 0, turn_order: 1, color: "#FFA0A0", createdAt: now, updatedAt: now},
                    {id_timer: 3, id_user: null, name: "Bob", start: null, elapsed: 0, turn_order: 2, color: "#0FA0FF", createdAt: now, updatedAt: now},
                    {id_timer: 3, id_user: null, name: "Patrick", start: null, elapsed: 0, turn_order: 3, color: "#FFFF00", createdAt: now, updatedAt: now}
                ])
            });
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('PlayerGameTimers', null, {}).then(() => {
            return queryInterface.bulkDelete('ReloadGameTimers', null, {}).then(() => {
                return queryInterface.bulkDelete('GameTimers', null, {});
            });
        });
    }
};
