const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const boolParser = require('express-query-boolean');
const cors = require('cors');
const i18n = require("i18n");
const winston = require('winston');
const winstonExpress = require('express-winston');
const logging = require("./api/util/logging");

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

/**---------------------*
 * INTERNATIONALIZATION *
 *----------------------*/
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

/**---------------------*
 *       LOGGING        *
 *----------------------*/

const log_format = winston.format.printf((options) => {
  return `[${options.timestamp}] [${options.level}] [${options.label}] ${options.message}`;
});

const get_default_format = (label) => {
  return winston.format.combine(
      winston.format.label({label}),
      winston.format.colorize(),
      winston.format.timestamp(),
      log_format
  );
};

const log_transports = [ new winston.transports.Console() ];

const express_winston_logger_defaults = {
  headerBlacklist: ["Authentication"],
  requestWhitelist: ["query", "body"]
};

const LOG_LEVEL = process.VERBOSITY || (new Set(["test", "development"]).has(process.env.NODE_ENV) ? "debug" : "info");
const custom_logger_defaults = {
  transports: log_transports,
  level: LOG_LEVEL
};

/**
 * Define two loggers out of express's ones
 * - db: for database related logging (e.g. dumping queries)
 * - ws: for websocket related logging
 * - api: for api errors related logging
 */
let ws_logger = winston.loggers.add("ws", { ... custom_logger_defaults, format: get_default_format("WS") });
let db_logger = winston.loggers.add("db", { ... custom_logger_defaults, format: get_default_format("DB") });  // used in api/config/config.js
let api_logger = winston.loggers.add("api", { ... custom_logger_defaults, format: get_default_format("API") });

/**
 * Define a logger for express middleware for logging request path, response status...
 */
app.use(winstonExpress.logger({
  ... express_winston_logger_defaults,
  transports: log_transports,
  format: get_default_format("API"),
  msg: "HTTP {{res.statusCode}} {{req.method}} {{req.url}}",
  level: function (req, res) {
    let level = "debug";
    if (res.statusCode >= 100) { level = "info"; }
    if (res.statusCode >= 400) { level = "warn"; }
    if (res.statusCode >= 500) { level = "error"; }
    return level;
  }
}));

/**---------------------*
 *      WEBSOCKET       *
 *----------------------*/
const server = require('http').createServer(app);
const sockets = require('./api/sockets');
const io = require('socket.io')(server);
io.logger = ws_logger;
io.set('origins', '*:*');
sockets(io);

/**---------------------*
 *       ROUTES         *
 *----------------------*/
let routes = require('./api/routes');
routes(app);

// replacing default express error handler to log errors
app.use((err, req, res, next) => {
  if (res.headersSent) {  // the default handler closes the connection in this case
    console.log("err");
    return next(err);
  }
  logging.logError(winston.loggers.get("api"), err);
  res.status(500).json({success: false, msg: "error"});
});

if(!module.parent) {
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
}

module.exports = server;