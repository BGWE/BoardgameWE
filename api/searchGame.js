const request = require('request');
const _api = require("../common/api");
let parse_string = require('xml2js').parseString;

const BGG_ROOT_PATH = 'https://www.boardgamegeek.com/xmlapi2/';
const DEFAULT_TYPE = 'boardgame';

function get_game_id_from_item(_json) {
    if (_json.hasOwnProperty('$') && _json.$.hasOwnProperty('id')) return _json.$.id;

    throw new Error('No id in ' + JSON.stringify(_json))
}

function get_game_type_from_item(_json) {
    if (_json.hasOwnProperty('$') && _json.$.hasOwnProperty('type')) return _json.$.type;

    throw new Error('No type in ' + JSON.stringify(_json))
}

function get_game_name_from_item(_json) {
    if (_json.hasOwnProperty('name')) {
        if (_json.name[0].hasOwnProperty('$') && _json.name[0].$.hasOwnProperty('value')) {
            return _json.name[0].$.value;
        }
    }

    throw new Error('No name in ' + JSON.stringify(_json))
}

function get_game_year_from_item(_json) {
    if (_json.hasOwnProperty('yearpublished')) {
        if (_json.name[0].hasOwnProperty('$') && _json.name[0].$.hasOwnProperty('value')) {
            return _json.yearpublished[0].$.value;
        }
    }

    throw new Error('No year in ' + JSON.stringify(_json))
}

function format_response(callback) {
    function _format_response(err, response, body) {
        if (err) {console.log(err); return;}

        parse_string(body, function (err, result) {
            if (err) {console.log(err); return;}

            let games = [];

            result.items.item.forEach(function (_item) {
                console.log(JSON.stringify(_item));
                games.push({
                    'name': get_game_name_from_item(_item),
                    'year': get_game_year_from_item(_item),
                    'id': get_game_id_from_item(_item)
                })
            });

            console.dir(games);

            callback(null, games);
        });
    }

    return _format_response
}


function search(boardgame_name, callback) {
    let url_variables = {query: boardgame_name, type: DEFAULT_TYPE};
    request(
        {url: BGG_ROOT_PATH + 'search', qs: url_variables},
        format_response(callback)
    )
}

exports.handler = function(event, context, callback) {
    console.log('Handler');

    function return_error(msg) {
        console.error(msg);
        callback(msg)
    }

    console.log('Received event:', JSON.stringify(event, null, 2));

    if (!event.pathParameters) {
        return_error("No game provided (no pathParameters).");
    }

    if (!("pathParameters" in event)) {
        return_error("No pathParameters provided.");
    }

    if (!("name" in event.pathParameters)) {
        return_error("No Game name provided.");
    }

    let name = event.pathParameters.name;

    search(name, function (err, games) {
        if (err) return_error(err);

        callback(null, _api.build_response(200, {"data": games}));
    });
};

exports.search = search;
exports.get_game_id_from_item = get_game_id_from_item;
exports.get_game_type_from_item = get_game_type_from_item;
exports.get_game_name_from_item = get_game_name_from_item;
exports.get_game_year_from_item = get_game_year_from_item;
