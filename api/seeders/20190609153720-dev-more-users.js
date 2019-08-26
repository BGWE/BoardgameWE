'use strict';
const bcrypt = require("bcryptjs");

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.bulkInsert('Users', [{
          name: 'Jean',
          surname: 'Valjean',
          email: 'jv@demo.com',
          password: bcrypt.hashSync("pass123"),
          admin: false,
          validated: true,
          username: 'jvaljean',
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
          name: 'Geoff',
          surname: 'Emerich',
          email: 'ge@demo.com',
          password: bcrypt.hashSync("pass123"),
          admin: false,
          validated: true,
          username: 'gemerick',
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
          name: 'Peter',
          surname: 'McAlister',
          email: 'pm@demo.com',
          password: bcrypt.hashSync("pass123"),
          admin: false,
          validated: true,
          username: 'pmcalister',
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
