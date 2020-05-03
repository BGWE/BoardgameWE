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
      }),
      queryInterface.addColumn("Events", "user_can_join", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      })
    ]).then(() => {
      /**
       * exclude impossible configurations of visibility and join policy:
       * - visibility == secret && invite_required == false
       * - visibility == secret && user_can_join == true
       * - visibility != secret && invite_required == true && user_can_join == true
       * (optimized boolean expression excluding those cases)
       */
      queryInterface.addConstraint('Events', ['invite_required'], {
        type: 'check',
        where: {
          [Sequelize.Op.or]: [
            {
              [Sequelize.Op.not]: {
                [Sequelize.Op.or]: [
                  {visibility: "SECRET"},
                  {invite_required: true}
                ]
              }
            },
            {
              [Sequelize.Op.and]: [
                {user_can_join: false},
                {invite_required: true}
              ]
            },
          ]
        }
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("Events", "attendees_can_edit"),
      queryInterface.removeColumn("Events", "invite_required"),
      queryInterface.removeColumn("Events", "user_can_join")
    ]);
  }
};
