'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("BoardGameExpansions", {
      id_expanded: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {model: 'BoardGames', key: 'id'},
        onDelete: 'cascade'
      },
      id_expansion: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {model: 'BoardGames', key: 'id'},
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
      return queryInterface.addConstraint('BoardGameExpansions', ['id_expanded'], {
        type: 'check',
        where: { id_expanded: { [Sequelize.Op.ne]: { [Sequelize.Op.col]: 'BoardGameExpansions.id_expansion' } } }
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("BoardGameExpansions");
  }
};
