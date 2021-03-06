'use strict';

let fs        = require('fs');
let path      = require('path');
let Sequelize = require('sequelize');
let env       = process.env.NODE_ENV;
let basename  = path.basename(__filename);
let db_config = require(__dirname + '/../config/config.js')[env];
let db        = {};

let sequelize = new Sequelize(db_config.database, db_config.username, db_config.password, db_config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Sequelize.Op;

/**
 * Create a select query for selecting an attribute from a possibly filtered table
 * @param table Table name
 * @param attribute Attribute name
 * @param where Fitlering clause
 * @returns {*}
 */
db.selectFieldQuery = function(table, attribute, where) {
  return db.selectQuery(table, { attributes: [attribute], where });
};

/**
 * Simplifies the call to the query generator for building a select query
 * @param table The table name
 * @param options The select options
 * @returns {*}
 */
db.selectQuery = function(table, options) {
  return db.sequelize.dialect.QueryGenerator.selectQuery(table, { ... options }).slice(0, -1);
};

/**
 * Negate a sequelize where clause if the condition is false
 * @param condition Boolean False if must be negated, true otherwise
 * @param clause Object Sequelize clause
 */
db.negateIf = function(condition, clause) {
  return condition ? clause : {[db.Op.not]: clause};
};

module.exports = db;
