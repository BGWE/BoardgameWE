let winston = require('winston');
let logging = require('../util/logging');
var fs = require('fs');

let db_logger = winston.loggers.add("db", {
  transports: [ new winston.transports.Console() ],
  level: logging.get_log_level(),
  format: logging.get_default_format("DB")
});

let database = {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
    timezone: process.env.TIMEZONE || "UTC",
    seederStorage: "sequelize",
    logging: (msg) => {
      db_logger.debug(msg);
    }
};

if (process.env.USE_SSL) {
    database.dialectOptions = {
      ssl: {
        key: fs.readFileSync('/home/ec2-user/certs/privkey.pem', 'utf-8'),
        cert: fs.readFileSync('/home/ec2-user/certs/cert.pem', 'utf-8'),
        ca: fs.readFileSync('/home/ec2-user/certs/rds-combined-ca-bundle.pem', 'utf-8'),
        checkServerIdentity: false,
      }
    };
}

// for sequelize to return bigint as int and not string
require('pg').defaults.parseInt8 = true;

module.exports = {
    jwt_secret_key: process.env.JWT_SECRET_KEY,
    jwt_duration: process.env.JWT_DURATION || "4 days",
    frontend_url: process.env.FRONTEND_URL || 'https://www.boardgamecomponion.com',
    email_settings: {
        sender_name: 'BoardGameComponion',
        email_address: 'info@boardgamecomponion.com'
    },
    sendgrid_api_key: process.env.SENDGRID_API_KEY,
    [process.env.NODE_ENV]: database
};