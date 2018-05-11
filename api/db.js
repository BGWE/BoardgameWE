const Sequelize = require('sequelize');

exports.getSequelize = function () {
    return new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
        host: process.env.DB_HOSTNAME,
        port: process.env.DB_PORT || 5432,
        logging: console.log,
        maxConcurrentQueries: 100,
        dialect: 'postgres',
        dialectOptions: {
            ssl:'Amazon RDS'
        },
        pool: { maxConnections: 5, maxIdleTime: 30},
        language: 'en'
    });
};