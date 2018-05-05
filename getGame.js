console.log('Loading function');

let AWS = require('aws-sdk');
AWS.config.update({
    region: "eu-west-1",
    endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
});

console.log('AWS configured');


function build_response(statusCode, body, isBase64Encoded) {
    let resp = {};
    resp.statusCode = statusCode;
    resp.headers = {"Content-Type": "application/json"};
    resp.isBase64Encoded = false;

    if (body !== undefined) resp.body=JSON.stringify(body);
    if (isBase64Encoded !== undefined) resp.isBase64Encoded=isBase64Encoded;

    return resp;
}

exports.handler = function(event, context, callback) {
    console.log('Handler');

    function return_error(msg) {
        console.error(msg);
        callback(msg)
    }

    console.log('Received event:', JSON.stringify(event, null, 2));

    if (!event.pathParameters) {
        return_error("No Game ID provided.");
    }

    if (!("pathParameters" in event)) {
        return_error("No pathParameters provided.");
    }

    if (!("gameid" in event.pathParameters)) {
        return_error("No Game ID provided.");
    }


    let docClient = new AWS.DynamoDB.DocumentClient();

    let table = "games";

    let params = {
        TableName: table,
        Key: {
            "bggid": event.pathParameters.gameid
        }
    };

    console.log("Params:", JSON.stringify(params, null, 2));

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read table. Error JSON:", JSON.stringify(err, null, 2));
            callback(null, build_response(err.statusCode, err.message))
        } else {
            console.log("Scan succeeded:", JSON.stringify(data, null, 2));
            console.log("Response: ", JSON.stringify(build_response(200, {"games": data.Items}), null, 2));
            callback(null, build_response(200, {"games": data.Items}))
        }
    });

};