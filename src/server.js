require('appmetrics-dash').monitor();

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const boolParser = require('express-query-boolean');
const cors = require('cors');
const i18n = require("i18n");
const winston = require('winston');
const winstonExpress = require('express-winston');
const logging = require("./api/util/logging");
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

app.use(bodyParser.json({limit: '50mb'})); // support json encoded bodies
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // support encoded bodies
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
  directory: __dirname + '/api/locales/json',
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

const log_transports = [ new winston.transports.Console() ];

const express_winston_logger_defaults = {
  headerBlacklist: ["Authentication"],
  requestWhitelist: ["query", "body"]
};

const custom_logger_defaults = {
  transports: log_transports,
  level: logging.get_log_level()
};

/**
 * Define two loggers out of express's ones
 * - db: for database related logging (e.g. dumping queries)
 * - ws: for websocket related logging
 * - api: for api errors related logging
 */
let ws_logger = winston.loggers.add("ws", { ... custom_logger_defaults, format: logging.get_default_format("WS") });
let api_logger = winston.loggers.add("api", { ... custom_logger_defaults, format: logging.get_default_format("API") });

/**
 * Define a logger for express middleware for logging request path, response status...
 */
app.use(winstonExpress.logger({
  ... express_winston_logger_defaults,
  transports: log_transports,
  format: logging.get_default_format("API"),
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
const sockets = require('./websockets/sockets');
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
    api_logger.crit("An unhandled error was caught by the global error handler, but headers were already sent.");
    logging.logError(api_logger, err);
    return next(err);
  }
  logging.logError(api_logger, err);
  res.status(500).json({success: false, msg: "error"});
});

if(!module.parent) {
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
}

module.exports = server;