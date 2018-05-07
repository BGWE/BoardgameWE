let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;


let _dynamo = require('../../dynamo/dynamo');
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
