console.log('Loading function');

let _api = require('../common/api');
let _dynamo = require('../dynamo/dynamo');

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


    console.log(`Received game ID: ${event.pathParameters.gameid}`);
    gameid = parseInt(event.pathParameters.gameid);
    if (!gameid) {
        console.log(`Failed to parse Game ID: ${gameid}`);
        callback(null, _api.build_response(400, {"message": "Game ID format is not valid."}))
    }

    let table = "games";
    _dynamo.query(table, gameid, "bggid", function (err, data) {
        if (err) {
            console.error("Unable to read table. Error JSON:", JSON.stringify(err, null, 2));
            callback(null, _api.build_response(err.statusCode, err.message))
        } else {
            console.log("Scan succeeded:", JSON.stringify(data, null, 2));
            console.log("Response: ", JSON.stringify(_api.build_response(200, {"data": data.Items[0]}), null, 2));
            callback(null, _api.build_response(200, {"data": data.Items[0]}))
        }
    });
};