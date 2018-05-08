let AWS = require('aws-sdk');
AWS.config.update({
    region: "eu-west-1",
    endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
});

let _api = require('../common/api');

const GAMES_TABLE_KEY_NAME = 'bggid';

function build_put_parameters(table, item) {
    return {
        TableName: table,
        Item: item
    }
}

function build_query_parameters(table, key_value, key_name) {
    return {
        TableName: table,
        KeyConditionExpression: `${key_name} = :k`,
        ExpressionAttributeValues: {
            ":k": key_value
        }
    }
}

// function get(table, key_value, key_name) {
//     let docClient = new AWS.DynamoDB.DocumentClient();
//     let params = build_parameters(table, key_value, key_name);
//
//     docClient.get(params, function (err, data) {
//         if (err) {
//             throw new Error(err);
//         } else {
//             return data;
//         }
//     });
// }

function query(table, key_value, key_name, callback) {
    let docClient = new AWS.DynamoDB.DocumentClient();
    let params = build_query_parameters(table, key_value, key_name);

    docClient.query(params, callback);
}

// Add an element to DynanoDB
// callback = (err, resp) => ()
function put(table, body, callback) {
    // Check if id is present

    if (!body.hasOwnProperty(GAMES_TABLE_KEY_NAME)) {
        callback(new Error("Game ID (" + GAMES_TABLE_KEY_NAME + ") not found in the body: " + JSON.stringify(body)), null);
        return;
    }

    let docClient = new AWS.DynamoDB.DocumentClient();
    let params = build_put_parameters(table, body);

    docClient.put(params, function (err, data) {
        if (err) { callback(err, null); }

        callback(null, "Item added")
    })

}

// exports.get = get;
exports.put = put;
exports.query = query;
exports.build_put_parameters = build_put_parameters;
exports.build_query_parameters = build_query_parameters;