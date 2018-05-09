const request = require('request');
let parse_string = require('xml2js').parseString;

const BGG_ROOT_PATH = 'https://www.boardgamegeek.com/xmlapi2/';
const DEFAULT_TYPE = 'boardgame';

function search(boardgame_name, callback) {
    let url_variables = {query: boardgame_name, type: DEFAULT_TYPE};
    request(
        {url: BGG_ROOT_PATH + 'search', qs: url_variables},
        format_search_response(callback)
    )
}

function get(boardgame_id, callback) {
    let url_variables = {id: boardgame_id};
    request(
        {url: BGG_ROOT_PATH + 'thing', qs: url_variables},
        format_get_response(callback)
    )
}

function format_search_response(callback) {
    function _format_response(err, response, body) {
        if (err) {console.log(err); return;}

        parse_string(body, function (err, result) {
            if (err) {console.log(err); return;}

            let games = [];

            result.items.item.forEach(function (_item) {
                games.push({
                    'name': get_game_name_from_item(_item),
                    'year': get_attribute(get_tag(_item, 'yearpublished')[0], 'value'),
                    'id': get_attribute(_item, 'id')
                })
            });

            callback(null, games);
        });
    }

    return _format_response
}

function format_get_response(callback) {
    function _format_response(err, response, body) {
        if (err) {console.log(err); return;}

        parse_string(body, function (err, result) {
            if (err) {console.log(err); return;}
            let game = {};

            result.items.item.forEach(function (_item) {
                console.log('====');
                console.dir(_item);
            });

            callback(null, game);
        });
    }

    return _format_response
}

function get_attribute(_json, attribute) {
    if (_json.hasOwnProperty('$') && _json.$.hasOwnProperty(attribute)) return _json.$[attribute];

    throw new Error('No ' + attribute + ' in ' + JSON.stringify(_json))
}

// Returns list of child tag <tag_name>
function get_tag(_json, tag_name) {
    if (_json.hasOwnProperty(tag_name)) return _json[tag_name];

    throw new Error('No ' + tag_name + ' in ' + JSON.stringify(_json))
}

function get_attribute_from_tag(_json, tag_name, attribute) {
    return get_attribute(get_tag(_json, tag_name)[0], attribute)
}

function get_game_name_from_item(_json) {
    if (_json.hasOwnProperty('name')) {
        if (_json['name'].length > 1) {
            // There could be "alternate" names, need to find the "primary" one
            let primary_name = _json['name'].filter(function (_name) {
                return _name.hasOwnProperty('$') && _name.$.hasOwnProperty('type') && _name.$.type === "primary"
            });
            return primary_name[0].$.value;
        }
        if (_json.name[0].hasOwnProperty('$') && _json.name[0].$.hasOwnProperty('value')) {
            return _json.name[0].$.value;
        }
    }

    throw new Error('No name in ' + JSON.stringify(_json))
}

exports.get = get;
exports.search = search;
exports.get_attribute = get_attribute;
exports.get_tag = get_tag;
exports.get_attribute_from_tag = get_attribute_from_tag;
exports.get_game_name_from_item = get_game_name_from_item;
