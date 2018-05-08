let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;


let _dynamo = require('../../dynamo/dynamo');
describe('Build parameters', function () {
    it('should create a correctly formatted dictionary query parameters', function () {
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

    it('should create a correctly formatted dictionary put parameters', function () {
        let params = _dynamo.build_put_parameters('games', {'bggid': 100000, 'otherkey': 'value'});

        console.log(params);

        assert.typeOf(params, 'Object');
        expect(params).to.deep.equal({
            TableName: 'games',
            Item: {'bggid': 100000, 'otherkey': 'value'}
        });
    });
});

describe('DynamoDB interaction', function () {
    let test_table = 'games_test';
    let test_body = { name: 'TestGame', bggid: 111111, bggscore: 10 };
    let false_test_body = { name: 'TestGame', bggscore: 10 };

    it('should put an item in a table', function (done) {
        return _dynamo.put(test_table, test_body, function (err, data) {
            assert(err == null, 'err is not null: ' + err);

            expect(data).to.equal("Item added");
            done();
        })
    });

    it('should not put an item in a table if key is missing', function (done) {
        return _dynamo.put(test_table, false_test_body, function (err, data) {
            assert(data == null, 'data is not null: ' + err);

            expect(err).not.to.be.null;
            done();
        })
    });

    it('should query a table with the value of the partition key only', function (done) {
        return _dynamo.query(test_table, 169786, 'bggid', function (err, data) {
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
