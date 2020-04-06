const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;

const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../src/api/models/index');

const userController = require('../src/api/UserController');
const includes = require('../src/api/util/db_include');


chai.use(chaiHttp);

const { TEST_PROTOCOL } = process.env;
const { TEST_HOST } = process.env;
const { TEST_PORT } = process.env;

const TEST_URL = `${TEST_PROTOCOL}://${TEST_HOST}:${TEST_PORT}`;

TEST_USER_PASSWORD = 'mypass';
const TEST_USER = {
  name: 'Sterone',
  surname: 'Tester',
  email: 'qa@keeptesting.com',
  password: bcrypt.hashSync(TEST_USER_PASSWORD),
  admin: false,
  validated: true,
  username: 'testuser',
  createdAt: Sequelize.literal("(now() at time zone 'utc')"),
  updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
};

const USER1 = {
  name: 'Peter',
  surname: 'Parker',
  email: 'pp@demo.com',
  password: bcrypt.hashSync('pass123'),
  admin: true,
  validated: true,
  username: 'pparker',
  createdAt: Sequelize.literal("(now() at time zone 'utc')"),
  updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
};

const USER2 = {
  name: 'John',
  surname: 'Lennon',
  email: 'jl@demo.com',
  password: bcrypt.hashSync('pass123'),
  admin: false,
  validated: false,
  username: 'jlennon',
  createdAt: Sequelize.literal("(now() at time zone 'utc')"),
  updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
};

describe('User Controller Tests:', () => {
  beforeEach(async () => {
    await db.User.sync({ force: true });
    await db.User.create(TEST_USER); // ID = 1
    await db.User.create(USER1);
    await db.User.create(USER2);
  });

  // afterEach(async () => {
  //   await db.User.destroy({
  //     where: {},
  //     truncate: true
  //   });
  // });

  describe('Utils functions', () => {
    describe('Remove sensitive data', () => {
      it('should remove sensitive data from user object', () => {
        const user = {
          name: 'John',
          firstName: 'Oliver',
          password: 'mypassword213',
          validated: false,
        };

        const cleanedUser = userController.removeSensitive(user);
        for (let i = 0; i < includes.userExcludedAttributes.length; i++) {
          const attribute = includes.userExcludedAttributes[i];
          expect(cleanedUser[attribute]).to.be.undefined;
        }
      });
    });
  });

  describe('Non-authenticated requests', () => {
    describe('Login', () => {
      it('should login successfully', (done) => {
        const payload = {
          username: TEST_USER.username,
          password: TEST_USER_PASSWORD,
        };
        chai.request(TEST_URL)
          .post('/user/login')
          .send(payload)
          .end((err, res) => {
            expect(err).to.be.null;

            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('token');
            expect(res.body.token).to.be.a('string');
            done();
          });
      });

      it('should fail login due to wrong password', (done) => {
        const payload = {
          username: TEST_USER.username,
          password: 'wrongpassword',
        };
        chai.request(TEST_URL)
          .post('/user/login')
          .send(payload)
          .end((err, res) => {
            expect(err).to.be.null;

            expect(res).to.have.status(401);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('success');
            expect(res.body.success).to.be.false;
            done();
          });
      });

      it('should fail login due to unvalidated user', (done) => {
        const payload = {
          username: 'jlennon',
          password: 'pass123',
        };
        chai.request(TEST_URL)
          .post('/user/login')
          .send(payload)
          .end((err, res) => {
            expect(err).to.be.null;

            expect(res).to.have.status(403);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('success');
            expect(res.body.success).to.be.false;
            done();
          });
      });
    });

    describe('Register', () => {
      it('should register a user successfully', (done) => {
        const payload = {
          name: 'Test',
          surname: 'User',
          email: 'testuser@test.com',
          password: 'testpassword',
          username: 'testanotheruser',
        };

        chai.request(TEST_URL)
          .post('/user')
          .send(payload)
          .end((err, res) => {
            expect(err).to.be.null;

            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('name');
            expect(res.body.name).to.be.equal(payload.name);
            expect(res.body).to.have.property('surname');
            expect(res.body.surname).to.be.equal(payload.surname);
            expect(res.body).to.have.property('email');
            expect(res.body.email).to.be.equal(payload.email);
            expect(res.body).to.not.have.property('password');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('admin');
            expect(res.body).to.have.property('createdAt');
            expect(res.body).to.have.property('updatedAt');
            done();
          });
      });

      it('should fail registering an existing user', (done) => {
        const payload = {
          name: 'Test',
          surname: 'User',
          email: 'jl@demo.com',
          password: 'testpassword',
          username: 'testuser',
        };

        chai.request(TEST_URL)
          .post('/user')
          .send(payload)
          .end((err, res) => {
            expect(err).to.be.null;

            expect(res).to.have.status(403);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('success');
            expect(res.body.success).to.be.false;
            done();
          });
      });

      it('should fail due to missing username', (done) => {
        const payload = {
          name: 'Incomplete',
          surname: 'User',
          email: 'incomplete@user.com',
          password: 'testpassword',
        };

        chai.request(TEST_URL)
          .post('/user')
          .send(payload)
          .end((err, res) => {
            expect(err).to.be.null;

            expect(res).to.have.status(400);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('success');
            expect(res.body.success).to.be.false;
            done();
          });
      });
    });
  });

  describe('Authenticated requests', () => {
    let authToken = '';

    before(async () => {
      const payload = {
        username: 'testuser',
        password: TEST_USER_PASSWORD,
      };
      await chai.request(TEST_URL)
        .post('/user/login')
        .send(payload)
        .then((res) => {
          authToken = `JWT ${res.body.token}`;
        });
    });

    describe('GET Current user', () => {
      it('should get current user information', (done) => {
        chai.request(TEST_URL)
          .get('/user/current')
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('username');
            expect(res.body.username).to.be.equal(TEST_USER.username);
            expect(res.body).to.have.property('admin');
            expect(res.body).to.have.property('createdAt');
            expect(res.body).to.have.property('updatedAt');
            done();
          });
      });

      it('should fail when not authenticated', (done) => {
        chai.request(TEST_URL)
          .get('/user/current')
          .end((err, res) => {
            expect(res).to.have.status(401);
            done();
          });
      });
    });

    describe('GET User', () => {
      it('should get specific user information from id', (done) => {
        chai.request(TEST_URL)
          .get('/user/1')
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('username');
            expect(res.body.username).to.be.equal(TEST_USER.username);
            done();
          });
      });

      it('should fail when not authenticated', (done) => {
        chai.request(TEST_URL)
          .get('/user/1')
          .end((err, res) => {
            expect(res).to.have.status(401);
            done();
          });
      });

      it('should fail when user is not found', (done) => {
        chai.request(TEST_URL)
          .get('/user/1111')
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            done();
          });
      });
    });

    describe('Update User (PUT)', () => {
      it('should update current user information', (done) => {
        const payload = {
          name: 'Peter2',
          surname: 'Parker2',
          email: 'pp2@demo.com',
        };

        chai.request(TEST_URL)
          .put('/user/1')
          .send(payload)
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('username');
            expect(res.body.username).to.be.equal(TEST_USER.username);
            expect(res.body).to.have.property('admin');
            expect(res.body).to.have.property('createdAt');
            expect(res.body).to.have.property('updatedAt');
            expect(res.body).to.have.property('name');
            expect(res.body.name).to.be.equal(payload.name);
            expect(res.body).to.have.property('surname');
            expect(res.body.surname).to.be.equal(payload.surname);
            expect(res.body).to.have.property('email');
            expect(res.body.email).to.be.equal(payload.email);
            done();
          });
      });

      it('should fail when not authenticated', (done) => {
        chai.request(TEST_URL)
          .put('/user/1')
          .end((err, res) => {
            expect(res).to.have.status(401);
            done();
          });
      });

      it('should fail when user does not have the right privileges', (done) => {
        chai.request(TEST_URL)
          .put('/user/1111')
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(res).to.have.status(403);
            done();
          });
      });
    });

    describe('Forgot password', () => {
      it('should fail if email is not found', (done) => {
        const payload = {
          email: 'fakeemail@test.com',
        };
        chai.request(TEST_URL)
          .post('/user/forgot_password')
          .send(payload)
          .end((err, res) => {
            expect(res).to.have.status(404);
            done();
          });
      });
    });

    describe('Reset password', () => {
      it('should fail if user is not found', (done) => {
        const payload = {
          token: 'token',
          id: '21345',
          password: 'new_password',
        };
        chai.request(TEST_URL)
          .post('/user/reset_password')
          .send(payload)
          .end((err, res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

      it('should fail if token is invalid', (done) => {
        const payload = {
          token: 'token',
          id: '1',
          password: 'new_password',
        };
        chai.request(TEST_URL)
          .post('/user/reset_password')
          .send(payload)
          .end((err, res) => {
            expect(res).to.have.status(403);
            done();
          });
      });
    });
  });
});
