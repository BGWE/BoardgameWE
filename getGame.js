console.log('Loading function');

let AWS = require('aws-sdk');
AWS.config.update({
    region: "eu-west-1",
    endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
});

console.log('AWS configured');

let _api = require('./common/api');
let _dynamo = require('./dynamo/dynamo');

exports.handler = function(event, context, callback) {
    console.log('Handler');

    function return_error(msg) {
        console.error(msg);
        callback(msg)
    }

    console.log('Received event:', JSON.stringify(event, null, 2));

    if (!event.pathParameters) {
        return_error("No Game ID provided (no pathParameters).");
    }

    if (!("pathParameters" in event)) {
        return_error("No pathParameters provided.");
    }

    if (!("gameid" in event.pathParameters)) {
        return_error("No Game ID provided.");
    }

    let gameid = null;

    try {
        gameid = parseInt(event.pathParameters)
    } catch (e) {
        console.log(e);
        callback(null, _api.build_response(400, {"message": "Game ID format is not valid."}))
    }


    let docClient = new AWS.DynamoDB.DocumentClient();

    let table = "games";
    _dynamo.query(table, gameid, "bggid", function (err, data) {
        if (err) {
            console.error("Unable to read table. Error JSON:", JSON.stringify(err, null, 2));
            callback(null, _api.build_response(err.statusCode, err.message))
        } else {
            console.log("Scan succeeded:", JSON.stringify(data, null, 2));
            console.log("Response: ", JSON.stringify(_api.build_response(200, {"games": data.Items}), null, 2));
            callback(null, _api.build_response(200, {"games": data.Items}))
        }
    });
};