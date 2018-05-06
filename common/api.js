exports.build_response = function(statusCode, body, isBase64Encoded) {
    let resp = {};
    resp.statusCode = statusCode;
    resp.headers = {"Content-Type": "application/json"};
    resp.isBase64Encoded = false;

    if (body !== undefined) resp.body=JSON.stringify(body);
    if (isBase64Encoded !== undefined) resp.isBase64Encoded=isBase64Encoded;

    return resp;
};
