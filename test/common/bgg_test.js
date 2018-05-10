let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;

let _bgg = require('../../api/util/bgg');

let json_rsp = JSON.parse('{"items":{"$":{"total":"15","termsofuse":"https://boardgamegeek.com/xmlapi/termsofuse"},"item":[{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"169786"},"name":[{"$":{"type":"primary","value":"Scythe"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"199727"},"name":[{"$":{"type":"primary","value":"Scythe: Invaders from Afar"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"212879"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #37"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"204984"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #38"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"221033"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #39"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232176"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #40"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232087"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #41"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"237663"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #42"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"211731"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #1"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"205121"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #2"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211732"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #3"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211733"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #4"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"242277"},"name":[{"$":{"type":"primary","value":"Scythe: The Rise of Fenris"}}],"yearpublished":[{"$":{"value":"2018"}}]},{"$":{"type":"boardgame","id":"223555"},"name":[{"$":{"type":"primary","value":"Scythe: The Wind Gambit"}}],"yearpublished":[{"$":{"value":"2017"}}]}]}}\n');
let json_rsp_item = JSON.parse('{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]}');
let json_rsp_mlt_names = JSON.parse('{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}, {"$":{"type":"alternative","value":"My Little Scythe2"}}],"yearpublished":[{"$":{"value":"2017"}}]}');
let json_rsp_item_false = {'key': 'value'};
let json_get_rsp = {"$":{"type":"boardgame","id":"169786"},"link":[{"$":{"type":"boardgamecategory","id":"1015","value":"Civilization"}},{"$":{"type":"boardgamecategory","id":"1021","value":"Economic"}},{"$":{"type":"boardgamecategory","id":"1046","value":"Fighting"}},{"$":{"type":"boardgamecategory","id":"1047","value":"Miniatures"}},{"$":{"type":"boardgamecategory","id":"1016","value":"Science Fiction"}},{"$":{"type":"boardgamecategory","id":"1086","value":"Territory Building"}},{"$":{"type":"boardgamemechanic","id":"2080","value":"Area Control / Area Influence"}},{"$":{"type":"boardgamemechanic","id":"2676","value":"Grid Movement"}},{"$":{"type":"boardgamemechanic","id":"2020","value":"Simultaneous Action Selection"}},{"$":{"type":"boardgamemechanic","id":"2015","value":"Variable Player Powers"}},{"$":{"type":"boardgamefamily","id":"26464","value":"Alternate History"}},{"$":{"type":"boardgamefamily","id":"25158","value":"Components: Miniatures"}},{"$":{"type":"boardgamefamily","id":"8374","value":"Crowdfunding: Kickstarter"}},{"$":{"type":"boardgamefamily","id":"38432","value":"Scythe"}},{"$":{"type":"boardgamefamily","id":"5666","value":"Solitaire Games"}},{"$":{"type":"boardgamefamily","id":"27646","value":"Tableau Building"}},{"$":{"type":"boardgameexpansion","id":"199727","value":"Scythe: Invaders from Afar"}},{"$":{"type":"boardgameexpansion","id":"212879","value":"Scythe: Promo Encounter Card #37"}},{"$":{"type":"boardgameexpansion","id":"204984","value":"Scythe: Promo Encounter Card #38"}},{"$":{"type":"boardgameexpansion","id":"221033","value":"Scythe: Promo Encounter Card #39"}},{"$":{"type":"boardgameexpansion","id":"232176","value":"Scythe: Promo Encounter Card #40"}},{"$":{"type":"boardgameexpansion","id":"232087","value":"Scythe: Promo Encounter Card #41"}},{"$":{"type":"boardgameexpansion","id":"237663","value":"Scythe: Promo Encounter Card #42"}},{"$":{"type":"boardgameexpansion","id":"211731","value":"Scythe: Promo Pack #1"}},{"$":{"type":"boardgameexpansion","id":"205121","value":"Scythe: Promo Pack #2"}},{"$":{"type":"boardgameexpansion","id":"211732","value":"Scythe: Promo Pack #3"}},{"$":{"type":"boardgameexpansion","id":"211733","value":"Scythe: Promo Pack #4"}},{"$":{"type":"boardgameexpansion","id":"242277","value":"Scythe: The Rise of Fenris"}},{"$":{"type":"boardgameexpansion","id":"223555","value":"Scythe: The Wind Gambit"}},{"$":{"type":"boardgameimplementation","id":"226320","value":"My Little Scythe"}},{"$":{"type":"boardgamedesigner","id":"62640","value":"Jamey Stegmaier"}},{"$":{"type":"boardgameartist","id":"33148","value":"Jakub Rozalski"}},{"$":{"type":"boardgamepublisher","id":"23202","value":"Stonemaier Games"}},{"$":{"type":"boardgamepublisher","id":"4304","value":"Albi"}},{"$":{"type":"boardgamepublisher","id":"3475","value":"Arclight"}},{"$":{"type":"boardgamepublisher","id":"34522","value":"Crowd Games"}},{"$":{"type":"boardgamepublisher","id":"6194","value":"Delta Vision Publishing"}},{"$":{"type":"boardgamepublisher","id":"22380","value":"Feuerland Spiele"}},{"$":{"type":"boardgamepublisher","id":"30213","value":"Fire on Board Jogos"}},{"$":{"type":"boardgamepublisher","id":"4785","value":"Ghenos Games"}},{"$":{"type":"boardgamepublisher","id":"29242","value":"Ludofy Creative"}},{"$":{"type":"boardgamepublisher","id":"30677","value":"Maldito Games"}},{"$":{"type":"boardgamepublisher","id":"5400","value":"Matagot"}},{"$":{"type":"boardgamepublisher","id":"28323","value":"Morning"}},{"$":{"type":"boardgamepublisher","id":"36186","value":"PHALANX"}},{"$":{"type":"boardgamepublisher","id":"34744","value":"Playfun Games"}}]};

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

    it('should parse a JSON response and give the tags `tag` with value for attribute', function () {
        let att_value = 'boardgamemechanic';
        let tags = _bgg.get_tags_for_attribute(json_get_rsp, 'link', 'type', att_value);

        expect(tags.every(function (tag) {
            return tag.$.type === att_value;
        }))
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