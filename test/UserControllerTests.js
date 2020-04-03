const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;

const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

const db = require('../src/api/models/index');

const userController = require('../src/api/UserController');
const includes = require('../src/api/util/db_include');

chai.use(chaiHttp);

const { TEST_PROTOCOL } = process.env;
const { TEST_HOST } = process.env;
const { TEST_PORT } = process.env;

const TEST_URL = `${TEST_PROTOCOL}://${TEST_HOST}:${TEST_PORT}`;

describe('User Controller Tests:', () => {
  beforeEach(async () => {
    await db.User.sync({ force: true });
    await db.User.create({
      name: 'Peter',
      surname: 'Parker',
      email: 'pp@demo.com',
      password: bcrypt.hashSync('pass123'),
      admin: true,
      validated: true,
      username: 'pparker',
      createdAt: Sequelize.literal("(now() at time zone 'utc')"),
      updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
    });
    await db.User.create({
      name: 'John',
      surname: 'Lennon',
      email: 'jl@demo.com',
      password: bcrypt.hashSync('pass123'),
      admin: false,
      validated: false,
      username: 'jlennon',
      createdAt: Sequelize.literal("(now() at time zone 'utc')"),
      updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
    });
  });

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
          username: 'pparker',
          password: 'pass123',
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
          username: 'pparker',
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
          username: 'testuser',
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
        username: 'pparker',
        password: 'pass123',
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
            expect(res.body.username).to.be.equal('pparker');
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
      it('should get current user information', (done) => {
        chai.request(TEST_URL)
          .get('/user/1')
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('username');
            expect(res.body.username).to.be.equal('pparker');
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
      it('should get current user information', (done) => {
        const payload = {
          name: 'Peter2',
          surname: 'Parker2',
          email: 'pp2@demo.com',
        };

        chai.request(TEST_URL)
          .put('/user/1')
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('username');
            expect(res.body.username).to.be.equal('pparker');
            expect(res.body).to.have.property('admin');
            expect(res.body).to.have.property('createdAt');
            expect(res.body).to.have.property('updatedAt');
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
  });
});
