/**
 *  Many2Many helpers
 */
const util = require('./util');
const db = require('../models/index');

/**
 * Add associations
 * @param req Request
 * @param res Response
 * @param m2m helper options
 * @param m2m.model_class Sequelize model
 * @param m2m.fixed.id int The fixed id
 * @param m2m.fixed.field str
 * @param m2m.other.ids Array Array of identifier for the second field
 * @param m2m.other.field str The variable id field
 * @param m2m.other.includes The includes for generating the response
 * @param m2m.attributes Other attributes values (undefined)
 * @param m2m.error_message str Validation error message
 * @param m2m.options Object options (transaction,...)
 * @param transform A function that would transfer the generated data
 * @returns {Promise<T>}
 */
exports.addAssociations = function(req, res, m2m, transform) {
    return m2m.model_class.bulkCreate(
        m2m.other.ids.map(id => { return {
            [m2m.fixed.field]: m2m.fixed.id,
            [m2m.other.field]: id,
            ... m2m.attributes };
        }), {ignoreDuplicates: true, ... m2m.options }
    ).then(() => {
        return exports.sendAssociations(res, m2m, transform);
    }).catch(err => {
        console.debug(err);
        return util.errorResponse(res);
    });
};

/**
 * @param res
 * @param m2m helper options
 * @param m2m.model_class Sequelize model
 * @param m2m.fixed.id int The fixed id
 * @param m2m.fixed.field str
 * @param m2m.other.includes The includes for generating the response
 * @param m2m.options Object options (transaction,...)
 * @param transform A function that would transfer the generated data
 * @returns {*}
 */
exports.sendAssociations = function(res, m2m, transform) {
    return util.sendModelOrError(res, m2m.model_class.findAll({
        where: { [m2m.fixed.field]: m2m.fixed.id },
        include: m2m.other.includes,
        ... m2m.options
    }), transform);
};

/**
 * @param req
 * @param res
 * @param m2m options
 * @param m2m.model_class Sequelize model
 * @param m2m.fixed.id int The fixed id
 * @param m2m.fixed.field str
 * @param m2m.other.ids Array Array of identifier for the second field
 * @param m2m.other.field str The variable id field
 * @param m2m.other.includes The includes for generating the response
 * @param m2m.options Object options (transaction,...)
 * @param transform A function that would transfer the generated data
 * @returns {*}
 */
exports.deleteAssociations = function(req, res, m2m, transform) {
    return m2m.model_class.destroy({
        where: {
            [m2m.fixed.field]: m2m.fixed.id,
            [m2m.other.field]: m2m.other.ids
        },
        ... m2m.options
    }).then(() => {
        return exports.sendAssociations(res, m2m, transform);
    }).catch(err => {
        console.debug(err);
        return util.errorResponse(res);
    });
};

/**
 * Return array of promises for diffing the set of association for a given fixed field.
 * @param m2m helper options
 * @param m2m.model_class Sequelize model
 * @param m2m.fixed.id int The fixed id
 * @param m2m.fixed.field str
 * @param m2m.other.ids Array Array of identifier for the second field
 * @param m2m.other.field str The variable id field
 * @param m2m.attributes Other attributes values
 * @param m2m.options Object options (transaction,...)
 */
exports.diffAssociations = function (m2m) {
  const to_insert = m2m.other.ids.map(id => { return { ... m2m.attributes, [m2m.fixed.field]: m2m.fixed.id, [m2m.other.field]: id }; });
  let queries = [
    m2m.model_class.destroy({ where: {
      [m2m.fixed.field]: m2m.fixed.id,
      [m2m.other.field]: {[db.Op.notIn]: m2m.other.ids}
    }, ... m2m.options })
  ];
  if (m2m.other.ids.length > 0) {
    queries.push(m2m.model_class.bulkCreate(to_insert, {ignoreDuplicates: true, ... m2m.options}));
  }
  return queries;
};