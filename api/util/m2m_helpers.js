/**
 *  Many2Many helpers
 */

const { validationResult } = require('express-validator/check');
const util = require('./util');

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
 * @returns {Promise<T>}
 */
exports.addAssociations = function(req, res, m2m) {
    return m2m.model_class.bulkCreate(
        m2m.other.ids.map(id => { return {
            [m2m.fixed.field]: m2m.fixed.id,
            [m2m.other.field]: id,
            ... m2m.attributes };
        }), {ignoreDuplicates: true, ... m2m.options }
    ).then(() => {
        return exports.sendAssociations(res, m2m);
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
 * @returns {*}
 */
exports.sendAssociations = function(res, m2m) {
    return util.sendModelOrError(res, m2m.model_class.findAll({
        where: { [m2m.fixed.field]: m2m.fixed.id },
        include: m2m.other.includes,
        ... m2m.options
    }));
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
 * @returns {*}
 */
exports.deleteAssociations = function(req, res, m2m) {
    return m2m.model_class.destroy({
        where: {
            [m2m.fixed.field]: m2m.fixed.id,
            [m2m.other.field]: m2m.other.ids
        }
    }).then(() => {
        return exports.sendAssociations(res, m2m);
    }).catch(err => {
        console.debug(err);
        return util.errorResponse(res);
    });
};
