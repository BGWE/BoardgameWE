const lodash = require("lodash");

exports.listToString = (list) => {
    if (list.length === 0) {
        return "";
    }
    let str = list[0];
    for (let i = 1; i < list.length; ++i) {
        str += "," + list[i];
    }
    return str;
};

exports.parseList = function(s, fn, sep) {
    return s.split(sep).map(v => fn(v));
};

exports.boolOrDefault = function(b, deflt) {
    return b !== undefined ? b : deflt;
};

/**
 *
 * @param data
 * @param score_fn
 * @param lower_better
 * @param [write_fn] A function defining how to write new fields. Prototype (o, f, v) where o element of which the rank
 * are currently defined, f is the name of the rank to write and v its value
 * @returns {*}
 */
exports.rank = (data, score_fn, lower_better, write_fn) => {
    write_fn = write_fn || ((o, f, v) => {o[f] = v;});
    let copy = data.slice(0);
    copy.sort((a, b) => (lower_better ? -1 : 1) * (score_fn(b) - score_fn(a)));

    const best_score = copy.length > 0 ? copy[0].score : 0;
    let prev_score = null,
        prev_natu_rank = 0,
        prev_skip_rank = 0;

    for (let i = 0; i < copy.length; ++i) {
        if (prev_score !== copy[i].score) {
            prev_skip_rank = i + 1;
            prev_natu_rank = prev_natu_rank + 1;
            prev_score = copy[i].score;
        }
        write_fn(copy[i], 'score', score_fn(copy[i]));
        write_fn(copy[i], 'natural_rank', prev_natu_rank);
        write_fn(copy[i], 'rank', prev_natu_rank);
        write_fn(copy[i], 'skip_rank', prev_skip_rank);
        write_fn(copy[i], 'win', copy[i].score === best_score);
    }
    return copy;
};

exports.rankPlayersFromData = (dict, aggregate) => {
    let scores = lodash.obj
    for (let _key in dict.players) {
        if (!dict.players.hasOwnProperty(_key)) { continue; }
        scores.push({
            score: dict.points[_key].length === 0 ? 0 : aggregate(dict.points[_key]),
            player: dict.players[_key]
        })
    }
    return exports.rank(scores, (player) => player.score, false);
};

/** object marking a success */
exports.successObj = {success: true};
exports.errorObj = {error: "err"};

/**
 * Return a success json response containing the given data
 * @param res
 * @param data
 * @returns {*}
 */
exports.successResponse = function(res, data) {
    return res.status(200).json(data);
};

exports.sendSuccessObj = function(res) {
    return exports.successResponse(res, {success: true});
};

/**
 * Error 500 with {error: "err"} JSON body
 * @param res
 * @returns {*}
 */
exports.errorResponse = function(res) {
    return exports.detailErrorResponse(res, 500, "error");
};

/**
 * Error with given cande and {message: msg, error: "err"} JSON body
 * @param res
 * @param code
 * @param msg
 * @param errors Object containing the validation errors
 * @returns {*}
 */
exports.detailErrorResponse = function(res, code, msg, errors) {
    errors = errors === undefined ? [] : errors.array({ onlyFirstError: true });
    return res.status(code).json({success: false, message: msg, errors});
};

exports.sendModelOrError = function(res, promise, transform) {
    if (transform === undefined) {
        transform = (a) => a; // identity by default
    }
    return promise
        .then(obj => {
            if (!obj) {
                return exports.detailErrorResponse(res, 404, "not found");
            }
            return exports.successResponse(res, transform(obj));
        })
        .catch(err => {
            console.log(err);
            return exports.errorResponse(res);
        })
};


exports.handleDeletion = function(res, promise) {
    return promise
        .then(obj => {
            return exports.successResponse(res, exports.successObj);
        })
        .catch(err => {
            return exports.errorResponse(res);
        })
};

exports.asyncMiddleware = function(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };
};

/**
 * Extract pagination param from a request. Parameters are sought for in the query paramters.
 * @param req Request Express request object
 * @param order A list of database field to order on (sequelize convention)
 * @returns {{limit: (*|undefined), offset: (*|number), order: *}}
 */
exports.getPaginationParams = function(req, order) {
    return {
        limit: req.query.max_items || undefined,
        offset: req.query.start || 0,
        order
    };
};

/**
 *
 * @param set1
 * @param set2
 * @returns {Set<any>}
 */
exports.set_diff = function(set1, set2) {
    return new Set([...set1].map(v => !set2.has(v)));
};