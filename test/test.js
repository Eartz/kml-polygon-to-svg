var assert = require("assert");
var projections = require("../dist/projections.js").default;
describe('Projections', function(){
    describe('#equirectangular', function(){
        var φ0 = 42.735;
        it("Input longitude: 0.340641 should return x: 5454.241427691459 with φ0 = 42.735", function() {
            var expected = 27.82106855875556;
            var actual = projections.equirectangular.x(0.340641, φ0);
            assert.equal(expected, actual);
        });
    });
});
