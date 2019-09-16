let chai = require('chai');
let assert = chai.assert;
let util = require('../api/util/util');

describe('Utilities "api/util" tests:', () => {
  describe('util.js', () => {
    it('should onvert a list to a string', () => {
      assert.equal(util.listToString(["a", "b", "c"]), "a,b,c");
      assert.equal(util.listToString(["a"]), "a");
      assert.equal(util.listToString([]), "");
    });

    it('should parse a comma-separated list string into a list', () => {
      assert.deepEqual(util.parseList("a,b,d", i => i, ","), ["a", "b", "d"]);
      assert.deepEqual(util.parseList("-1,2,3", i => parseInt(i), ","), [-1, 2, 3]);
    });

    it('should get boolean value or default if undefined', () => {
      assert.equal(util.boolOrDefault(undefined, false), false);
      assert.equal(util.boolOrDefault(undefined, true), true);
      assert.equal(util.boolOrDefault(false, false), false);
      assert.equal(util.boolOrDefault(true, false), true);
      assert.equal(util.boolOrDefault(true, true), true);
      assert.equal(util.boolOrDefault(false, true), false);
    });

    it('should rank an array of objects', () => {
      const undefData;
      const undefRank = util.rank(undefData, o => o.score, true, (o, f, v) => { o[f] = v; });
      assert.equal(undefRank, [], "rank() must return an empty array");

      const data = [{ score: 1 }, { score: 2 }];
      const ranked = util.rank(data, o => o.score, true, (o, f, v) => { o[f] = v; });
      assert.notEqual(data, ranked, "rank() must return a copy");
      assert.deepEqual(ranked, [
        {score: 1, natural_rank: 1, rank: 1, skip_rank: 1, win: true},
        {score: 2, natural_rank: 2, rank: 2, skip_rank: 2, win: false}
      ]);

      const data2 = [{ score: 1, n: "1" }, {score: 2, n: "2"}, { score: 1, n: "3"}];
      const ranked2 = util.rank(data2, o => o.score, true, (o, f, v) => { o[f] = v; });
      assert.deepEqual(ranked2, [
        {score: 1, natural_rank: 1, rank: 1, skip_rank: 1, win: true, n: "1"},
        {score: 1, natural_rank: 1, rank: 1, skip_rank: 1, win: true, n: "3"},
        {score: 2, natural_rank: 2, rank: 2, skip_rank: 3, win: false, n: "2"}
      ]);

      const data3 = [{ score: 1, n: "1" }, {score: 2, n: "2"}, { score: 1, n: "3"}];
      const ranked3 = util.rank(data3, o => o.score, false, (o, f, v) => { o[f] = v; });
      assert.deepEqual(ranked3, [
        {score: 2, natural_rank: 1, rank: 1, skip_rank: 1, win: true, n: "2"},
        {score: 1, natural_rank: 2, rank: 2, skip_rank: 2, win: false, n: "1"},
        {score: 1, natural_rank: 2, rank: 2, skip_rank: 2, win: false, n: "3"},
      ]);
    });
  });
});