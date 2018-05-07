let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe('Top', function () {
    importTest('dynamo/dynamo', './dynamo/dynamo_test');
    importTest('common/API', './common/api_test');
    importTest('api/searchGame', './api/searchGame_test')
});
