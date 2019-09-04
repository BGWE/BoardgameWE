
let database = {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
    timezone: process.env.TIMEZONE || "UTC",
    seederStorage: "sequelize"
};

if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "testing") {
    database.logging = console.log;
} else {
    database.logging = false;
}

if (process.env.USE_SSL) {
    database.dialectOptions = {ssl: true};
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