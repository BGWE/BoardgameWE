const Sequelize = require('sequelize');

exports.getSequelize = function () {
    return new Sequelize(process.env.database, process.env.username, process.env.password, {
        host: process.env.host,
        port: process.env.port || 5432,
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