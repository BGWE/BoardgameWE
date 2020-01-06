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
      }, {
        name: 'Tony',
        surname: 'Stark',
        email: 'tony@stark.com',
        password: bcrypt.hashSync("pass123"),
        admin: false,
        validated: false,
        username: 'tstark',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    }, {
        name: 'Carol',
        surname: 'Danvers',
        email: 'carold@aol.com',
        password: bcrypt.hashSync("pass123"),
        admin: false,
        validated: false,
        username: 'cdanvers',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    }, {
        name: 'Jennifer',
        surname: 'Walters',
        email: 'jen@legal.com',
        password: bcrypt.hashSync("pass123"),
        admin: false,
        validated: false,
        username: 'jwalters',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    }, {
        name: 'T',
        surname: 'Challa',
        email: 'tchalla@wakanda.com',
        password: bcrypt.hashSync("pass123"),
        admin: false,
        validated: false,
        username: 'tchalla',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    }, {
        name: 'Geralt',
        surname: 'Rivia',
        email: 'comeon@roach.com',
        password: bcrypt.hashSync("pass123"),
        admin: false,
        validated: false,
        username: 'grivia',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    }, {
        name: 'Fitz',
        surname: 'Farseer',
        email: 'fitz@farsee.com',
        password: bcrypt.hashSync("pass123"),
        admin: false,
        validated: false,
        username: 'ffarseer',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    }, {
        name: 'Toss',
        surname: 'Coin',
        email: 'tossacoin@witcher.com',
        password: bcrypt.hashSync("pass123"),
        admin: false,
        validated: false,
        username: 'tcoin',
        createdAt: Sequelize.literal("(now() at time zone 'utc')"),
        updatedAt: Sequelize.literal("(now() at time zone 'utc')")
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {
      where: {[Sequelize.Op.or]: [
        {username: "pmcalister"},
        {username: "gemerick"},
        {username: "jvaljean"},
        {username: "tstark"},
        {username: "cdanvers"},
        {username: "jwalters"},
        {username: "tchalla"},
        {username: "grivia"},
        {username: "ffarseer"},
        {username: "tcoin"}
      ]}
    });
  }
};
