let AWS = require('aws-sdk');
AWS.config.update({
    region: "eu-west-1",
    endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
});

let _api = require('../common/api');

function build_parameters(table, key_value, key_name) {
    return {
        TableName: table,
        Key: {
            key_name: key_value
        }
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

function get(table, key_value, key_name) {
    let docClient = new AWS.DynamoDB.DocumentClient();
    let params = build_parameters(table, key_value, key_name);

    docClient.get(params, function (err, data) {
        if (err) {
            throw new Error(err);
        } else {
            return data;
        }
    });
}

function query(table, key_value, key_name, callback) {
    console.log('Query...');
    let docClient = new AWS.DynamoDB.DocumentClient();
    let params = build_query_parameters(table, key_value, key_name);

    console.log(`Params:`);
    console.log(params);

    docClient.query(params, callback);
}

exports.get = get;
exports.query = query;
exports.build_parameters = build_parameters;
exports.build_query_parameters = build_query_parameters;