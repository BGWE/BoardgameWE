'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return queryInterface.createTable('ReloadGameTimers', {
        id: {
          type: Sequelize.INTEGER,
          increment: false,
          primaryKey: true,
        },
        timer_type: {
          type: '"enum_GameTimers_timer_type"',
          allowNull: false,
          defaultValue: "RELOAD"
        },
        duration_increment: {
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
      }, {transaction}).then(() => {
        return Promise.all([
          queryInterface.addConstraint('ReloadGameTimers', ['id'], {
            type: 'foreign key',
            name: 'reload_timer_id_fk_constraint',
            references: {
              table: 'GameTimers',
              field: 'id'
            },
            onDelete: 'cascade',
            transaction
          }),
          queryInterface.sequelize.query(
            'ALTER TABLE "ReloadGameTimers" ' +
            'ADD CONSTRAINT reload_game_timers_isa_fk ' +
            'FOREIGN KEY (id, timer_type) ' +
            'REFERENCES "GameTimers"(id, timer_type) MATCH FULL', { transaction }
          ),
          queryInterface.addConstraint('ReloadGameTimers', ['timer_type'], {
            type: 'check',
            where: {timer_type: {[Sequelize.Op.eq]: "RELOAD"}},
            transaction
          })
        ]);
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ReloadGameTimers');
  }
};