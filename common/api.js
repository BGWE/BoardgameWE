exports.build_response = function(statusCode, body, isBase64Encoded) {
    let resp = {};
    resp.statusCode = statusCode;
    resp.headers = {"Content-Type": "application/json"};
    resp.isBase64Encoded = false;

    if (body !== undefined) resp.body=JSON.stringify(body);
    if (isBase64Encoded !== undefined) resp.isBase64Encoded=isBase64Encoded;

    return resp;
};

// Keys: list of string containing the keys needed in the payload
// Returns null if the payload contains all the keys. Returns the list of missing keys otherwise.
exports.validate_payload = function (payload, keys) {
    let missing_keys = [];
    keys.forEach(function (_key) {
       if (!payload.hasOwnProperty(_key)) {
           missing_keys.push(_key)
       }
    });

    if (missing_keys.length > 0) { return missing_keys; }

    return null;
};