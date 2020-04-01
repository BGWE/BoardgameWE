'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Events", "visibility", {
      type: Sequelize.ENUM("PUBLIC", "PRIVATE", "SECRET"),
      allowNull: false,
      defaultValue: "SECRET"
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.removeColumn("Events", "visibility", {transaction}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_Events_visibility\" RESTRICT", {transaction})
      ]);
    });
  }
};


