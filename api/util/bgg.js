const util = require("./util.js");
const rp = require('request-promise');
let parse_string = require('xml2js').parseString;

const BGG_ROOT_PATH = 'https://www.boardgamegeek.com/xmlapi2/';
const DEFAULT_TYPE = 'boardgame';

function search(boardgame_name) {
    let url_variables = {query: boardgame_name, type: DEFAULT_TYPE};
    return rp({uri: BGG_ROOT_PATH + 'search', qs: url_variables});
}

function get(boardgame_id) {
    let url_variables = {id: boardgame_id, stats: 1};
    return rp({uri: BGG_ROOT_PATH + 'thing', qs: url_variables});
}

function getBoardGamePromise(boardgame_id, res, _then) {
    return exports.get(boardgame_id).then(_then).catch(err => {
        return util.detailErrorResponse(res, 404, "could not fetch game from board game geek");
    });
}

function format_search_response(body) {
    let games = [];
    parse_string(body, function (err, result) {
        if (err) {console.log(err); return;}
        if (result.items.hasOwnProperty("item")) {
            result.items.item.forEach(function (_item) {
                games.push({
                    'name': get_game_name_from_item(_item),
                    'year': get_attribute_from_tag_or_null(_item, 'yearpublished', 'value'),
                    'id': get_attribute(_item, 'id')
                })
            });
        }
    });
    return games;
}

function format_get_response(body) {
    let game = {};
    parse_string(body, function (err, result) {
        if (err) {console.log(err); return;}
        const TAGS_WITH_CONTENT = ['thumbnail', 'image', 'description'];
        const SINGLE_TAGS = ['yearpublished', 'minplayers', 'maxplayers', 'playingtime', 'minplaytime', 'maxplaytime'];
        const LINK_TAGS_TYPE = ['boardgamecategory', 'boardgamemechanic', 'boardgamefamily', 'boardgameexpansion'];

        result.items.item.forEach(function (_item) {
            TAGS_WITH_CONTENT.forEach(function (tag) {
                game[tag] = get_tag(_item, tag);
            });

            SINGLE_TAGS.forEach(function (tag) {
                game[tag] = get_attribute_from_tag(_item, tag, 'value');
            });

            LINK_TAGS_TYPE.forEach(function (type) {
                let tags = get_tags_for_attribute(_item, 'link', 'type', type);

                game[type] = tags.map(function (tag) {
                    return tag.$.value;
                })
            });

            game["name"] = get_game_name_from_item(_item);
            game["score"] = get_rating(_item);
        });
    });
    return game;
}

function get_rating(_json) {
    if (_json.hasOwnProperty("statistics") && _json.statistics.length > 0 &&
        _json.statistics[0].hasOwnProperty("ratings") && _json.statistics[0].ratings.length > 0 &&
        _json.statistics[0].ratings[0].hasOwnProperty("average") && _json.statistics[0].ratings[0].average.length > 0) {
        return parseFloat(get_attribute(_json.statistics[0].ratings[0].average[0], "value"));
    }
    throw new Error("Cannot access average score from returned _json.")
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

function get_attribute_from_tag_or_null(_json, tag_name, attribute) {
    try {
        return get_attribute(get_tag(_json, tag_name)[0], attribute)
    } catch (e) {
        return null;
    }
}

function get_tags_for_attribute(_json, tag, attribute, attribute_value){
    let tags = get_tag(_json, tag);

    return tags.filter(function (_tag) {
        return _tag.hasOwnProperty('$') && _tag.$.hasOwnProperty(attribute) && _tag.$[attribute] === attribute_value;
    });
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
exports.getBoardGamePromise = getBoardGamePromise;
exports.search = search;
exports.format_get_response = format_get_response;
exports.format_search_response = format_search_response;
exports.get_attribute = get_attribute;
exports.get_tag = get_tag;
exports.get_attribute_from_tag = get_attribute_from_tag;
exports.get_tags_for_attribute = get_tags_for_attribute;
exports.get_game_name_from_item = get_game_name_from_item;
exports.get_rating = get_rating;
