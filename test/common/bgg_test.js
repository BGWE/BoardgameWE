let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;

let _bgg = require('../../common/bgg');

let json_rsp = JSON.parse('{"items":{"$":{"total":"15","termsofuse":"https://boardgamegeek.com/xmlapi/termsofuse"},"item":[{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"169786"},"name":[{"$":{"type":"primary","value":"Scythe"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"199727"},"name":[{"$":{"type":"primary","value":"Scythe: Invaders from Afar"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"212879"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #37"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"204984"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #38"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"221033"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #39"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232176"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #40"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232087"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #41"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"237663"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #42"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"211731"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #1"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"205121"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #2"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211732"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #3"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211733"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #4"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"242277"},"name":[{"$":{"type":"primary","value":"Scythe: The Rise of Fenris"}}],"yearpublished":[{"$":{"value":"2018"}}]},{"$":{"type":"boardgame","id":"223555"},"name":[{"$":{"type":"primary","value":"Scythe: The Wind Gambit"}}],"yearpublished":[{"$":{"value":"2017"}}]}]}}\n');
let json_rsp_item = JSON.parse('{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]}');
let json_rsp_item_false = {'key': 'value'};

describe('Getters from BGG response', function () {
    it('should parse a JSON response and give the ID of the game.', function () {
        let id = _bgg.get_game_id_from_item(json_rsp_item);

        expect(id).to.equal("226320");
    });

    it('should parse a JSON response and give the type of the game.', function () {
        let type = _bgg.get_game_type_from_item(json_rsp_item);

        expect(type).to.equal("boardgame");
    });

    it('should parse a JSON response and give the name of the game.', function () {
        let name = _bgg.get_game_name_from_item(json_rsp_item);

        expect(name).to.equal("My Little Scythe");
    });

    it('should parse a JSON response and give the year of the game.', function () {
        let year = _bgg.get_game_year_from_item(json_rsp_item);

        expect(year).to.equal("2017");
    });

    it('should parse a JSON response and give the ID of the game (false case).', function () {
        expect(function (){_bgg.get_game_id_from_item(json_rsp_item_false)}).to.throw(Error);
    });

    it('should parse a JSON response and give the type of the game (false case).', function () {
        expect(function (){_bgg.get_game_type_from_item(json_rsp_item_false)}).to.throw(Error);
    });

    it('should parse a JSON response and give the name of the game (false case).', function () {
        expect(function (){_bgg.get_game_name_from_item(json_rsp_item_false)}).to.throw(Error);
    });

    it('should parse a JSON response and give the year of the game (false case).', function () {
        expect(function (){_bgg.get_game_year_from_item(json_rsp_item_false)}).to.throw(Error);
    });
});

describe('Search function', function () {
    it('should search Boardgame Geek to find the correct game.', function (done) {
        _bgg.search("Scythe", function (err, games) {
            assert(err == null, 'err is not null');
            assert(games, 'Response is empty');

            let found_game = false;

            games.forEach(function (_item) {
                if (_item.name === "Scythe") {
                    found_game = true;
                    return;
                }
            });

            assert.isTrue(found_game, "Scythe not found in response");
            done();
        })
    });
});