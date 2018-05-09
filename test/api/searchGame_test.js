let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;

let _search_game = require('../../api/searchGame');

describe('Handler', function () {
    it('should search Boardgame Geek to find the correct game via the handler (good UC).', function (done) {
        let event = {pathParameters: {name: "Scythe"}};
        let context = null;
        function callback(err, data) {
            assert(err == null, 'err is not null');

            expect(data).to.deep.equal({ statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                isBase64Encoded: false,
                body: '{"data":[{"name":"My Little Scythe","year":"2017","id":"226320"},{"name":"Scythe","year":"2016","id":"169786"},{"name":"Scythe: Invaders from Afar","year":"2016","id":"199727"},{"name":"Scythe: Promo Encounter Card #37","year":"2016","id":"212879"},{"name":"Scythe: Promo Encounter Card #38","year":"2016","id":"204984"},{"name":"Scythe: Promo Encounter Card #39","year":"2017","id":"221033"},{"name":"Scythe: Promo Encounter Card #40","year":"2017","id":"232176"},{"name":"Scythe: Promo Encounter Card #41","year":"2017","id":"232087"},{"name":"Scythe: Promo Encounter Card #42","year":"2017","id":"237663"},{"name":"Scythe: Promo Pack #1","year":"2016","id":"211731"},{"name":"Scythe: Promo Pack #2","year":"2016","id":"205121"},{"name":"Scythe: Promo Pack #3","year":"2016","id":"211732"},{"name":"Scythe: Promo Pack #4","year":"2016","id":"211733"},{"name":"Scythe: The Rise of Fenris","year":"2018","id":"242277"},{"name":"Scythe: The Wind Gambit","year":"2017","id":"223555"}]}' }
            );
            done();
        }

        _search_game.handler(event, context, callback);
    });

    it('should search Boardgame Geek to find the correct game via the handler (good UC).', function (done) {
        let event = {pathParameters: 44};
        let context = null;
        function callback(err, data) {
            expect(err).to.equal('No Game name provided.');
            done();
        }

        _search_game.handler(event, context, callback);
    });

    it('should search Boardgame Geek to find the correct game via the handler (good UC).', function (done) {
        let event = {"key": "value"};
        let context = null;
        function callback(err, data) {
            expect(err).to.equal('No game provided (no pathParameters).');
            done();
        }

        _search_game.handler(event, context, callback);
    });
});