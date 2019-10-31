const util = require("./util.js");
const rp = require('request-promise');
const winston = require("winston");
const logging = require("./logging");
let parse_string = require('xml2js').parseString;

const BGG_ROOT_PATH = 'https://www.boardgamegeek.com/xmlapi2/';
const DEFAULT_TYPE = 'boardgame';

function search(boardgame_name) {
    let qs = {query: boardgame_name, type: DEFAULT_TYPE};
    const uri = BGG_ROOT_PATH + 'search';
    winston.loggers.get("api").info("bgg search - url:" + uri + " query:" + JSON.stringify(qs));
    return rp({uri, qs});
}

function get(ids) {
  let qs = {id: ids.map(s => s.toString()).join(), stats: 1};
  const uri = BGG_ROOT_PATH + 'thing';
  winston.loggers.get("api").info("bgg get - url:" + uri + " query:" + JSON.stringify(qs));
  return rp({uri, qs, resolveWithFullResponse: true});
}

/**
 * Send a get request and adapt to http errors when some occurs
 * @param ids Bgg ids to fetch
 * @param wait_time Wait time when limited rate of bgg api is reached
 * @returns {Promise<Array>} List of parsed fetched games
 */
async function get_parse_retry(ids, wait_time=5000) {
  let fetched = [];
  let chunks = [ids];
  while (chunks.length > 0) {
    try {
      console.log(chunks.map(c => c.length));
      let res = await get(chunks[0]);
      chunks = chunks.slice(1);
      fetched = fetched.concat(format_get_response(res.body));
    } catch (error) {
      const statusCode = error.statusCode;
      if (statusCode === 413 || statusCode === 414) { // request entity too large || request uri too long
        winston.loggers.get("api").info(`too large from bgg ${statusCode}`);
        let new_chunks = [], too_large = chunks[0].length;
        console.log(too_large);
        chunks.forEach(chunk => {
          if (chunk.length > Math.max(Math.floor(too_large / 2), 1)) {
            const half = Math.floor(chunk.length / 2); // split those which are too large in two
            console.log(`split ${chunk.length} ${half}`);
            new_chunks.push(chunk.slice(0, half));
            new_chunks.push(chunk.slice(half + 1));
          } else {
            console.log(`don't split ${chunk.length}`);
            new_chunks.push(chunk);
          }
        });
        console.log(new_chunks.map(c => c.length));
        chunks = new_chunks;
        util.sleep(1000);
      } else if (statusCode === 429) { // too many requests
        util.sleep(wait_time); // just wait and retry
      } else { // unhandled
        throw new Error(`unhandled error when fetching from BGG ${statusCode}`);
      }
    }
  }
  return fetched;
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
  let games = [];
  parse_string(body, function (err, result) {
    if (err) {
      winston.loggers.get("api").error(err);
      return;
    }
    const TAGS_WITH_CONTENT = ['thumbnail', 'image', 'description'];
    const SINGLE_TAGS = ['yearpublished', 'minplayers', 'maxplayers', 'playingtime', 'minplaytime', 'maxplaytime'];
    const LINK_TAGS_TYPE = ['boardgamecategory', 'boardgamemechanic', 'boardgamefamily'];

    result.items.item.forEach(function (_item) {
      let game = {};
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

      let expansions_tags = get_tags_for_attribute(_item, 'link', 'type', 'boardgameexpansion');
      game.expansion_of = expansions_tags
          .filter(t => has_attribute(t, 'inbound') && t.$.inbound === "true")
          .map(t => parseInt(t.$.id));

      game.expansions = expansions_tags
          .filter(t => !has_attribute(t, 'inbound') || t.$.inbound !== "true")
          .map(t => parseInt(t.$.id));

      game.id = parseInt(get_attribute(_item, "id"));
      game.name = get_game_name_from_item(_item);
      game.score = get_rating(_item);
      games.push(game);
    });
  });
  winston.loggers.get("api").debug("-- formatted board game from bgg --");
  winston.loggers.get("api").debug(JSON.stringify(games));
  return games;
}

function get_rating(_json) {
    if (_json.hasOwnProperty("statistics") && _json.statistics.length > 0 &&
        _json.statistics[0].hasOwnProperty("ratings") && _json.statistics[0].ratings.length > 0 &&
        _json.statistics[0].ratings[0].hasOwnProperty("average") && _json.statistics[0].ratings[0].average.length > 0) {
        return parseFloat(get_attribute(_json.statistics[0].ratings[0].average[0], "value"));
    }
    throw new Error("Cannot access average score from returned _json.")
}

function has_attribute(_json, attribute) {
  return _json.hasOwnProperty('$') && _json.$.hasOwnProperty(attribute);
}

function get_attribute(_json, attribute) {
    if (_json.hasOwnProperty('$') && _json.$.hasOwnProperty(attribute)) return _json.$[attribute];

    throw new Error('No ' + attribute + ' in ' + JSON.stringify(_json))
}

// Returns list of child tag <tag_name>
function get_tag(_json, tag_name) {
    return _json.hasOwnProperty(tag_name) ? _json[tag_name] : null;
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
exports.search = search;
exports.format_get_response = format_get_response;
exports.format_search_response = format_search_response;
exports.get_attribute = get_attribute;
exports.get_tag = get_tag;
exports.get_parse_retry = get_parse_retry;
exports.get_attribute_from_tag = get_attribute_from_tag;
exports.get_tags_for_attribute = get_tags_for_attribute;
exports.get_game_name_from_item = get_game_name_from_item;
exports.get_rating = get_rating;
