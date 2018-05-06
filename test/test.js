var assert = require('chai').assert;
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

// describe('Get game API', function() {
// //     let getgame = require('../getGame');
// //     describe('Build response', function() {
// //     });
// // });