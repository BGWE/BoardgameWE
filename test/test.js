let assert = require('chai').assert;
let expect = require("chai").expect;
let should = require("chai").should;

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe('Top', function () {
    importTest('common/bgg', './common/bgg_test');
});
