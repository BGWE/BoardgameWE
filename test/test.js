let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;


describe('common/API', function() {
    let _api = require('../common/api');
    describe('Build response', function() {
        it('should output a (AWS) correctly formatted response for a HTTP 200', function () {
            let resp = _api.build_response(200, {"key": "value"});

            assert.typeOf(resp, 'Object');
            expect(resp).to.deep.equal({
                'statusCode': 200,
                'headers': {"Content-Type": "application/json"},
                'isBase64Encoded': false,
                'body': JSON.stringify({"key": "value"})
            });
        });

        it('should output a (AWS) correctly formatted response for a HTTP 400', function () {
            let resp = _api.build_response(400, {"key": "value"});

            assert.typeOf(resp, 'Object');
            expect(resp).to.deep.equal({
                'statusCode': 400,
                'headers': {"Content-Type": "application/json"},
                'isBase64Encoded': false,
                'body': JSON.stringify({"key": "value"})
            });
        });

        it('should output a (AWS) correctly formatted response without body', function () {
            let resp = _api.build_response(400);

            assert.typeOf(resp, 'Object');
            expect(resp).to.deep.equal({
                'statusCode': 400,
                'headers': {"Content-Type": "application/json"},
                'isBase64Encoded': false
            });
        });


        it('should output a (AWS) correctly formatted response with isBase64Encoded', function () {
            let resp = _api.build_response(400, {"key": "value"}, true);

            assert.typeOf(resp, 'Object');
            expect(resp).to.deep.equal({
                'statusCode': 400,
                'headers': {"Content-Type": "application/json"},
                'isBase64Encoded': true,
                'body': JSON.stringify({"key": "value"})
            });
        });
    });
});

describe('dynamo/dynamo', function () {
    let _dynamo = require('../dynamo/dynamo');
    describe('Query parameters', function () {
        it('should create a correctly formatted dictionnary for the parameters', function () {
            let params = _dynamo.build_query_parameters('games', 169786, 'superkey');

            console.log(params);

            assert.typeOf(params, 'Object');
            expect(params).to.deep.equal({
                TableName: 'games',
                KeyConditionExpression: `superkey = :k`,
                ExpressionAttributeValues: {
                    ":k": 169786
                }
            });
        });
    });

    describe('Query DynamoDB', function () {
        it('should query a table with the value of the partition key only', function (done) {
            return _dynamo.query('games', 169786, 'bggid', function (err, data) {
                assert(err == null, 'err is not null: ' + err);

                console.log(err);
                console.log(data);

                expect(data).to.deep.equal({ Items: [ { name: 'Scythe', bggid: 169786, bggscore: 8.3 } ],
                    Count: 1,
                    ScannedCount: 1 }
                );
                done();
            });
        });
    });
});

describe('api/searchGame', function () {
    let _search_game = require('../api/searchGame');

    let json_rsp = JSON.parse('{"items":{"$":{"total":"15","termsofuse":"https://boardgamegeek.com/xmlapi/termsofuse"},"item":[{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"169786"},"name":[{"$":{"type":"primary","value":"Scythe"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"199727"},"name":[{"$":{"type":"primary","value":"Scythe: Invaders from Afar"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"212879"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #37"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"204984"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #38"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"221033"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #39"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232176"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #40"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"232087"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #41"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"237663"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Encounter Card #42"}}],"yearpublished":[{"$":{"value":"2017"}}]},{"$":{"type":"boardgame","id":"211731"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #1"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"205121"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #2"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211732"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #3"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"211733"},"name":[{"$":{"type":"primary","value":"Scythe: Promo Pack #4"}}],"yearpublished":[{"$":{"value":"2016"}}]},{"$":{"type":"boardgame","id":"242277"},"name":[{"$":{"type":"primary","value":"Scythe: The Rise of Fenris"}}],"yearpublished":[{"$":{"value":"2018"}}]},{"$":{"type":"boardgame","id":"223555"},"name":[{"$":{"type":"primary","value":"Scythe: The Wind Gambit"}}],"yearpublished":[{"$":{"value":"2017"}}]}]}}\n');
    let json_rsp_item = JSON.parse('{"$":{"type":"boardgame","id":"226320"},"name":[{"$":{"type":"primary","value":"My Little Scythe"}}],"yearpublished":[{"$":{"value":"2017"}}]}');

    describe('Getters from BGG response', function () {
        it('should parse a JSON response and give the ID of the game.', function () {
            let id = _search_game.get_game_id_from_item(json_rsp_item);

            expect(id).to.equal("226320");
        });

        it('should parse a JSON response and give the type of the game.', function () {
            let id = _search_game.get_game_type_from_item(json_rsp_item);

            expect(id).to.equal("boardgame");
        });

        it('should parse a JSON response and give the name of the game.', function () {
            let id = _search_game.get_game_name_from_item(json_rsp_item);

            expect(id).to.equal("My Little Scythe");
        });

        it('should parse a JSON response and give the year of the game.', function () {
            let id = _search_game.get_game_year_from_item(json_rsp_item);

            expect(id).to.equal("2017");
        });
    });

    describe('Search function', function () {
        it('should search Boardgame Geek to find the correct game.', function (done) {
            _search_game.search("Scythe", function (err, games) {
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
});