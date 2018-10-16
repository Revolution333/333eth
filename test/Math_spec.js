const Math = artifacts.require('./contracts/test/TestMath.sol');

let instance;

contract('Zero', function ([_, owner]) {
  before(async function () {
    instance = await Math.new({ from: owner });
  });
  describe('min', () => {
    it('min(0, 1)', async () => {
      let r = await instance.testMin(0, 1);
      assert.equal(r.toString(10), '0');
    });
    it('min(2, 1)', async () => {
      let r = await instance.testMin(2, 1);
      assert.equal(r.toString(10), '1');
    });
  });
});
