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

describe('Validate payload', function () {
    let keys = ['a', 'b', 'c', 'd'];
    it('should validate if payload if correctly formed', function () {
        let d = {'a': 1, 'b': 2, 'c': 3, 'd': 4};

        let res =_api.validate_payload(d, keys);

        expect(res).to.be.a('null');
    });

    it('should warn if payload if not correctly formed (missing key)', function () {
        let d = {'a': 1, 'b': 2, 'c': 3};

        let res =_api.validate_payload(d, keys);

        expect(res).to.not.have.members(['a', 'b', 'c']);
        expect(res).to.have.members(['d']);
    });
});