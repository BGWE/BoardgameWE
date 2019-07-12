'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return queryInterface.createTable('EventInvites', {
        id_event: {
          type: Sequelize.INTEGER,
          references: {model: 'Events', key: 'id'},
          onDelete: 'cascade'
        },
        id_invitee: {
          type: Sequelize.INTEGER,
          references: {model: 'Users', key: 'id'},
          onDelete: 'cascade'
        },
        id_inviter: {
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
      }, { transaction }).then(() => {
        return Promise.all([
          queryInterface.addConstraint('EventInvites', ['id_event', 'id_invitee'], {
            type: 'primary key',
            name: 'event_invites_primary_key',
            transaction
          }),
          queryInterface.addConstraint('EventInvites', ['id_invitee'], {
            type: 'check',
            where: {id_invitee: {[Sequelize.Op.ne]: {[Sequelize.Op.col]: 'EventInvites.id_inviter'}}},
            transaction
          })
        ]);
      });
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("EventInvites");
  }
};
