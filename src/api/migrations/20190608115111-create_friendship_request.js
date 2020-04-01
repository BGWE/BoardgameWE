'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return queryInterface.createTable('FriendshipRequests', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
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
        status: {
          type: Sequelize.ENUM("PENDING", "ACCEPTED", "REJECTED"),
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
        return queryInterface.addConstraint('FriendshipRequests', ['id_user_from'], {
          type: 'check',
          where: { id_user_from: { [Sequelize.Op.ne]: { [Sequelize.Op.col]: 'FriendshipRequests.id_user_to' } } },
          transaction
        });
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.dropTable("FriendshipRequests", { transaction }),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_FriendshipRequests_status\" RESTRICT", { transaction })
      ]);
    });
  }
};
