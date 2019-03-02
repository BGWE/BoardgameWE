'use strict';
const bcrypt = require("bcryptjs");

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.bulkInsert('Users', [{
          name: 'Peter',
          surname: 'Parker',
          email: 'pp@demo.com',
          password: bcrypt.hashSync("pass123"),
          admin: true,
          validated: true,
          username: 'pparker',
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
          name: 'John',
          surname: 'Lennon',
          email: 'jl@demo.com',
          password: bcrypt.hashSync("pass123"),
          admin: false,
          validated: true,
          username: 'jlennon',
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }, {
          name: 'Gollum',
          surname: 'Gollum',
          email: 'gg@demo.com',
          password: bcrypt.hashSync("pass123"),
          admin: false,
          validated: false,
          username: 'ggollum',
          createdAt: Sequelize.literal("(now() at time zone 'utc')"),
          updatedAt: Sequelize.literal("(now() at time zone 'utc')")
      }], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Users', null, {});
  }
};
