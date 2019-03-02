module.exports = {
    jwt_secret_key: process.env.JWT_SECRET_KEY,
    jwt_duration: process.env.JWT_DURATION || "4 days",
    development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: 'postgres',
        timezone: process.env.TIMEZONE || "UTC",
        seederStorage: "sequelize"
    },
    staging: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: 'postgres',
        dialectOptions: {
            ssl: true
        },
        timezone: process.env.TIMEZONE || "UTC",
        seederStorage: "sequelize"
    },
    test: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME + "_test",
        host: process.env.DB_HOSTNAME,
        dialect: 'postgres',
        timezone: process.env.TIMEZONE || "UTC",
        seederStorage: "sequelize"
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: 'postgres',
        timezone: process.env.TIMEZONE || "UTC"
    }
};