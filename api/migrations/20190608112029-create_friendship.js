'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Friendships', {
      id_user1: {
        type: Sequelize.INTEGER,
        references: {model: 'Users', key: 'id'},
        onDelete: 'cascade'
      },
      id_user2: {
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
        queryInterface.addConstraint('Friendships', ['id_user1', 'id_user2'], {
          type: 'primary key',
          name: 'friendships_primary_key'
        }),
        queryInterface.addConstraint('Friendships', ['id_user1'], {
          type: 'check',
          where: {id_user1: {[Sequelize.Op.ne]: {[Sequelize.Op.col]: 'Friendships.id_user2'}}}
        })
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Friendships");
  }
};
