let assert = require('chai').assert;
let expect = require("chai").expect;


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
    });
});

describe('dynamo/dynamo', function () {
    let _dynamo = require('../dynamo/dynamo');
    describe('Query DynamoDB', function () {
        it('should query a table with the value of the partition key only', function () {
            return _dynamo.query('games', 169786, 'bggid', function (err, data) {
                expect(data).to.deep.equal({ Items: [ { name: 'Scythe', bggid: 169786, bggscore: 8.3 } ],
                    Count: 1,
                    ScannedCount: 1 }
                );
            });
        });
    });
});

// describe('Get game API', function() {
// //     let getgame = require('../getGame');
// //     describe('Build response', function() {
// //     });
// // });