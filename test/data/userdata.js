const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

const TEST_USER_PASSWORD = 'mypass';

module.exports = Object.freeze({
  TEST_USER_PASSWORD,
  TEST_USER: {
    name: 'Sterone',
    surname: 'Tester',
    email: 'qa@keeptesting.com',
    password: bcrypt.hashSync(TEST_USER_PASSWORD),
    admin: false,
    validated: true,
    username: 'testuser',
    createdAt: Sequelize.literal("(now() at time zone 'utc')"),
    updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
  },

  USER1: {
    name: 'Peter',
    surname: 'Parker',
    email: 'pp@demo.com',
    password: bcrypt.hashSync('pass123'),
    admin: true,
    validated: true,
    username: 'pparker',
    createdAt: Sequelize.literal("(now() at time zone 'utc')"),
    updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
  },

  USER2: {
    name: 'John',
    surname: 'Lennon',
    email: 'jl@demo.com',
    password: bcrypt.hashSync('pass123'),
    admin: false,
    validated: false,
    username: 'jlennon',
    createdAt: Sequelize.literal("(now() at time zone 'utc')"),
    updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
  },
});
