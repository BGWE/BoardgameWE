'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("Events", "attendees_can_edit", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }),
      queryInterface.addColumn("Events", "invite_required", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }).then(() => {
        // force invite required if event visibility is 'secret'
        queryInterface.addConstraint('Events', ['invite_required'], {
          type: 'check',
          where: {
            [Sequelize.Op.or]: [
              { visibility: {[Sequelize.Op.ne]: "SECRET"} },
              { invite_required: true }
            ]
          }
        })
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
      Promise.all([
          queryInterface.removeColumn("Events", "attendees_can_edit"),
          queryInterface.removeColumn("Events", "invite_required")
      ]);
  }
};
