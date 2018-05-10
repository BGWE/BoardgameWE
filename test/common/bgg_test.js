let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;

let _bgg = require('../../common/bgg');

let json_rsp = JSON.parse('{"items":{"$":{"total":"15","termsofuse":"https://boardgamegeek.com/xmlapi/termsofuse"},"item":[{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"169786"},"name":[{"$":{"type":"primary","value":"Scythe"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"199727"},"name":[{"$":{"type":"primary","value":"Scythe: Invaders from Afar"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"212879"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #37"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"204984"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #38"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"221033"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #39"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232176"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #40"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232087"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #41"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"237663"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #42"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"211731"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #1"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"205121"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #2"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211732"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #3"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211733"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #4"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"242277"},"name":[{"$":{"type":"primary","value":"Scythe: The Rise of Fenris"}}],"yearpublished":[{"$":{"value":"2018"}}]},{"$":{"type":"boardgame","id":"223555"},"name":[{"$":{"type":"primary","value":"Scythe: The Wind Gambit"}}],"yearpublished":[{"$":{"value":"2017"}}]}]}}\n');
let json_rsp_item = JSON.parse('{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]}');
let json_rsp_mlt_names = JSON.parse('{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}, {"$":{"type":"alternative","value":"My Little Scythe2"}}],"yearpublished":[{"$":{"value":"2017"}}]}');
let json_rsp_item_false = {'key': 'value'};

describe('Getters from BGG response', function () {
    it('should parse a JSON response and give the name of the game.', function () {
        let name = _bgg.get_game_name_from_item(json_rsp_item);

        expect(name).to.equal("My Little Scythe");
    });

    it('should parse a JSON response and give the name of the game (multiple names).', function () {
        let name = _bgg.get_game_name_from_item(json_rsp_mlt_names);

        expect(name).to.equal("My Little Scythe");
    });

    it('should parse a JSON response and give an attribute.', function () {
        let id = _bgg.get_attribute(json_rsp_item, 'id');

        expect(id).to.equal("226320");
    });

    it('should parse a JSON response and give a tag.', function () {
        let name_tag = _bgg.get_tag(json_rsp_item, 'name');

        expect(name_tag[0]).to.deep.equal({"$":{"type":"primary","value":"My Little Scythe"}});
    });

    it('should parse a JSON response and give the attribute of a tag.', function () {
        let name = _bgg.get_attribute_from_tag(json_rsp_item, 'name', 'value');

        expect(name).to.equal("My Little Scythe");
    });


    it('should parse a JSON response and give an attribute (false case).', function () {
        expect(function (){_bgg.get_attribute(json_rsp_item_false, 'id')}).to.throw(Error);
    });

    it('should parse a JSON response and give a tag (false case).', function () {
        expect(function (){_bgg.get_tag(json_rsp_item_false, 'id')}).to.throw(Error);
    });

    it('should parse a JSON response and give the name of the game (false case).', function () {
        expect(function (){_bgg.get_game_name_from_item(json_rsp_item_false)}).to.throw(Error);
    });
});

describe('Search function', function () {
    it('should search Boardgame Geek to find the correct game.', function (done) {
        _bgg.search("Scythe", function (err, games) {
            assert(err == null, 'err is not null');
            assert(games, 'Response is empty');

            let found_game = false;

            // games.forEach(function (_item) {
            //     if (_item.name === "Scythe") {
            //         found_game = true;
            //         return;
            //     }
            // });

            found_game = games.some(function (_item) {
                return _item.name === "Scythe";
            });

            assert.isTrue(found_game, "Scythe not found in response");
            done();
        })
    });
});

describe('Get boardgame function', function () {
    it('should get Boardgame Geek game from its ID.', function (done) {
        _bgg.get("169786", function (err, game) {
            assert(err == null, 'err is not null');
            assert(game, 'Response is empty');

            console.dir(game);

            done();
        })
    });
});