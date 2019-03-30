'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ReloadGameTimers', {
      id_timer: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      timer_type: {
        type: '"enum_GameTimers_timer_type"',
        allowNull: false,
        defaultValue: "RELOAD"
      },
      increment: {
        type: Sequelize.BIGINT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(() => queryInterface.sequelize.query(
            'ALTER TABLE "ReloadGameTimers" ' +
            'ADD CONSTRAINT reload_game_timers_isa_fk ' +
            'FOREIGN KEY (id_timer, timer_type) ' +
            'REFERENCES "GameTimers"(id, timer_type) MATCH FULL'
    ).then(() => queryInterface.addConstraint('ReloadGameTimers', ['timer_type'], {
            type: 'check',
            where: { timer_type: { [Sequelize.Op.eq]: "RELOAD" } }
    })));
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ReloadGameTimers');
  }
};