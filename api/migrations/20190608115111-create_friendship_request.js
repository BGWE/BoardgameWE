'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('FriendshipRequests', {
      id_user_from: {
        type: Sequelize.INTEGER,
        references: {model: 'Users', key: 'id'},
        onDelete: 'cascade'
      },
      id_user_to: {
        type: Sequelize.INTEGER,
        references: {model: 'Users', key: 'id'},
        onDelete: 'cascade'
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
        queryInterface.addConstraint('FriendshipRequests', ['id_user_from', 'id_user_to'], {
          type: 'primary key',
          name: 'friendship_requests_primary_key'
        }),
        queryInterface.addConstraint('FriendshipRequests', ['id_user_from'], {
          type: 'check',
          where: { id_user_from: { [Sequelize.Op.ne]: { [Sequelize.Op.col]: 'FriendshipRequests.id_user_to' } } }
        })
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("FriendshipRequests");
  }
};
