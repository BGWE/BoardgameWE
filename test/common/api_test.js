let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;

let _api = require('../../common/api');
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