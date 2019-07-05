'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('EventJoinRequests', {
      id_event: {
        type: Sequelize.INTEGER,
        references: {model: 'Events', key: 'id'},
        onDelete: 'cascade'
      },
      id_requester: {
        type: Sequelize.INTEGER,
        references: {model: 'Users', key: 'id'},
        onDelete: 'cascade'
      },
      status: {
        type: '"enum_FriendshipRequests_status"',
        allowNull: false,
        defaultValue: "PENDING"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(() => {
      return queryInterface.addConstraint('EventJoinRequests', ['id_event', 'id_requester'], {
        type: 'primary key',
        name: 'event_join_requests_primary_key'
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("EventJoinRequests");
  }
};
