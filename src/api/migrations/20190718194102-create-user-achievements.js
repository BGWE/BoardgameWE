'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return queryInterface.createTable('UserAchievements', {
        id_user: {
          allowNull: false,
          references: {model: 'Users', key: 'id'},
          type: Sequelize.INTEGER
        },
        id_achievement: {
          allowNull: false,
          type: Sequelize.STRING
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
        return queryInterface.addConstraint('UserAchievements', ['id_user', 'id_achievement'], {
          type: 'primary key',
          name: 'user_achievements_primary_key',
          transaction
        });
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('UserAchievements');
  }
};