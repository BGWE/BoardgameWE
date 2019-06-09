'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('EventInvites', {
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
        type: Sequelize.ENUM("PENDING", "ACCEPTED", "REFUSED"),
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
      return Promise.all([
        queryInterface.addConstraint('EventInvites', ['id_invitee', 'id_inviter'], {
          type: 'primary key',
          name: 'event_invites_primary_key'
        }),
        queryInterface.addConstraint('EventInvites', ['id_invitee'], {
          type: 'check',
          where: {id_invitee: {[Sequelize.Op.ne]: {[Sequelize.Op.col]: 'EventInvites.id_inviter'}}}
        })
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable("EventInvites");
  }
};
