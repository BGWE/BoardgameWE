const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;

const db = require('../src/api/models/index');

const userController = require('../src/api/UserController');
const includes = require('../src/api/util/db_include');

// Data
var userdata = require('./data/userdata')
var bgdata   = require('./data/boardgamedata')

chai.use(chaiHttp);

// From environment variables

const { TEST_PROTOCOL } = process.env;
const { TEST_HOST } = process.env;
const { TEST_PORT } = process.env;

const TEST_URL = `${TEST_PROTOCOL}://${TEST_HOST}:${TEST_PORT}`;

async function seedUsers() {
  // await db.User.sync({ force: true });
  await db.User.bulkCreate([userdata.TEST_USER, userdata.USER1, userdata.USER2]);
}

async function clearUsers() {
  await db.User.destroy({
    where: {},
    truncate: { cascade: true }
  });
}

async function seedBoardGames() {
  // await db.BoardGame.sync({ force: true });
  let bg1 = await db.BoardGame.create(bgdata.BG1);
  let bg2 = await db.BoardGame.create(bgdata.BG2);
  return {
    board_games:[
      bg1.dataValues,
      bg2.dataValues
    ]
  }
}

async function clearBoardGames() {
  await db.BoardGame.destroy({
    where: {},
    truncate: { cascade: true }
  });
}

async function clearLibraryGames() {
  await db.LibraryGame.destroy({
    where: {},
    truncate: { cascade: true }
  });
}

async function login(username, password) {
  var authToken = null;
  var user_id = null;
  const payload = {
    username: username,
    password: password,
  };
  await chai.request(TEST_URL)
    .post('/user/login')
    .send(payload)
    .then((res) => {
      authToken = `JWT ${res.body.token}`;
      user_id = res.body.id;
    });

  return {
    token: authToken,
    id: user_id,
  };
}

context('User Controller Tests:', () => {
  before(() => {
    return seedUsers();
  });

  after(async () => {
    // await clearLibraryGames();
    await clearUsers();
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

  context('Non-authenticated requests', () => {
    describe('Login', () => {
      it('should login successfully', (done) => {
        const payload = {
          username: userdata.TEST_USER.username,
          password: userdata.TEST_USER_PASSWORD,
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
          username: userdata.TEST_USER.username,
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

  context('Authenticated requests', () => {
    let authToken = '';
    let current_user_id = null;

    before(async () => {
      let rsp = await login(userdata.TEST_USER.username, userdata.TEST_USER_PASSWORD);
      authToken = rsp.token;
      current_user_id = rsp.id;
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
            expect(res.body.username).to.be.equal(userdata.TEST_USER.username);
            expect(res.body).to.have.property('name');
            expect(res.body.name).to.be.equal(userdata.TEST_USER.name);
            expect(res.body).to.have.property('surname');
            expect(res.body.surname).to.be.equal(userdata.TEST_USER.surname);
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
          .get('/user/' + current_user_id)
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('username');
            expect(res.body.username).to.be.equal(userdata.TEST_USER.username);
            done();
          });
      });

      it('should fail when not authenticated', (done) => {
        chai.request(TEST_URL)
          .get('/user/' + current_user_id)
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
      after(async () => {
        await clearUsers();
        await seedUsers();
        rsp = await login(userdata.TEST_USER.username, userdata.TEST_USER_PASSWORD);
        authToken = rsp.token;
        current_user_id = rsp.id;
      });

      it('should fail when not authenticated', (done) => {
        chai.request(TEST_URL)
          .put('/user/' + current_user_id)
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

      it('should update current user information', (done) => {
        const payload = {
          name: 'Peter2',
          surname: 'Parker2',
          email: 'pp2@demo.com',
        };

        chai.request(TEST_URL)
          .put('/user/' + current_user_id)
          .send(payload)
          .set('Authentication', authToken)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('username');
            expect(res.body.username).to.be.equal(userdata.TEST_USER.username);
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
          id: current_user_id,
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

    describe('Add board games in user\'s library', () => {
      let board_games_id = [];
      before(async () => {
        let rsp = await seedBoardGames();
        board_games_id = rsp.board_games.map(x => x.id);
      });

      after(async () => {
        await clearLibraryGames();
        await clearBoardGames();
      });

      it('shoud add board games in current user\'s library', (done) => {
        const payload = {
          board_games: board_games_id.slice(0, 2)
        };
        chai.request(TEST_URL)
          .post('/user/current/library_games')
          .set('Authentication', authToken)
          .send(payload)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(err).to.be.null;
            expect(res.body).to.be.a('array');
            expect(res.body.length).to.be.equal(2);
            expect(res.body[0]).to.have.keys(['id_user', 'id_board_game', 'createdAt', 'updatedAt', 'board_game']);
            expect(res.body[1]).to.have.keys(['id_user', 'id_board_game', 'createdAt', 'updatedAt', 'board_game']);
            done();
          });
      });

      it('shoud fail adding board game in current user\'s library if board game doesn\'t exist', (done) => {
        const payload = {
          board_games: [8888]
        };
        chai.request(TEST_URL)
          .post('/user/current/library_games')
          .set('Authentication', authToken)
          .send(payload)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(err).to.be.null;
            done();
          });
      });
    });
  });
});
