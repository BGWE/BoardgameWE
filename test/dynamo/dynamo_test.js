let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;


let _dynamo = require('../../dynamo/dynamo');
describe('Build parameters', function () {
    it('should create a correctly formatted dictionary get item parameters', function () {
        let payload = {'a': 1, 'b': '2'};
        let params = _dynamo.build_get_parameters('games', {'a': 1, 'b': '2'});

        assert.typeOf(params, 'Object');
        expect(params).to.deep.equal({
            TableName: 'games',
            Key: payload
        });
    });

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
    let test_body = { name: 'TestGame', id: "d73f7252-6387-4c65-bf00-bcf4b9c2e86c", bggid: "111111", bggscore: 10, year: 2017};
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

    it('should get an item from a table with the value of the partition key and the range key', function (done) {
        return _dynamo.get(test_table, {id: test_body.id, bggid: test_body.bggid}, function (err, data) {
            assert(err == null, 'err is not null: ' + err);

            console.log(err);
            console.log(data);

            expect(data).to.deep.equal({ Item: test_body });
            done();
        });
    });

    it('should query a table with the value of the partition key only', function (done) {
        return _dynamo.query(test_table, test_body.id, 'id', function (err, data) {
            assert(err == null, 'err is not null: ' + err);

            console.log(err);
            console.log(data);

            expect(data).to.deep.equal({ Items: [ test_body ],
                Count: 1,
                ScannedCount: 1 }
            );
            done();
        });
    });

    it('should get an item from a table with the value of the partition key and the range key', function (done) {
        return _dynamo.delete_item(test_table, {id: test_body.id, bggid: test_body.bggid}, function (err, data) {
            assert(err == null, 'err is not null: ' + err);

            console.log(err);
            console.log(data);

            expect(data).to.deep.equal("Item deleted");
            done();
        });
    });
});
