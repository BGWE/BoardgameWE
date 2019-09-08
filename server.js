const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const boolParser = require('express-query-boolean');
const cors = require('cors');
const i18n = require("i18n");
const winston = require('winston');
const winstonExpress = require('express-winston');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(boolParser());
app.use(cors());
app.options('*', cors());

// api documentation
app.use('/doc', express.static(__dirname + '/doc'));

// i18n
i18n.configure({
  locales: ['en', 'fr'],
  directory: './api/locales/json',
  extension: '.i18n.json',
  defaultLocale: 'en',
  register: global,
  updateFiles: false,
  syncFiles: false,
  objectNotation: true
});
app.use(i18n.init);

// logging
const winston_logger_defaults = {
  transports: [ new winston.transports.Console() ],
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  headerBlacklist: ["Authentication"],
  requestWhitelist: ["query", "body"]
};

app.use(winstonExpress.logger({
  ... winston_logger_defaults,
  msg: "HTTP {{res.statusCode}} {{req.method}} {{req.url}}",
}));

// websocket
const server = require('http').createServer(app);
const sockets = require('./api/sockets');
const io = require('socket.io')(server);
io.set('origins', 'boardgamecomponion.com:*');
sockets(io);

// api
let routes = require('./api/routes');

// error logging
app.use(winstonExpress.errorLogger({
  ... winston_logger_defaults
}));

routes(app);

if(!module.parent) {
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
}


module.exports = server;