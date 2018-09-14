import getAccounts from './helpers/getAccounts';
import assertInvalidOpcode from './helpers/assertInvalidOpcode';
const Percent = artifacts.require('./contracts/test/TestPercent.sol');

let instance, owner;

let initContract = async function () {
  instance = await Percent.new({ from: owner });
};

let calc = function (num, den, val) {
  return Math.floor((val * num) / den);
};
contract('Percent', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    await initContract();
  });
      
  describe('mul', () => {
    it('5%', async () => {
      await instance.mul(5, 100, 200);
      let r = await instance.res();
      let m = calc(5, 100, 200);
      assert.equal(r.toNumber(), m);
    });
    it('105%', async () => {
      await instance.mul(105, 100, 777);
      let r = await instance.res();
      let m = calc(105, 100, 777);
      assert.equal(r.toNumber(), m);
    });
    it('return 0 if val 0', async () => {
      await instance.mul(5, 100, 0);
      let r = await instance.res();
      assert.equal(r.toNumber(), 0);
    });
    it('throw if den is 0', async () => {
      await assertInvalidOpcode(instance.mul(5, 0, 200));
    });
  });
  describe('div', () => {
    it('5%', async () => {
      await instance.div(5, 100, 155);
      let r = await instance.res();
      let m = calc(100, 5, 155);
      assert.equal(r.toNumber(), m);
    });
    it('105%', async () => {
      await instance.div(5, 100, 300);
      let r = await instance.res();
      let m = calc(100, 5, 300);
      assert.equal(r.toNumber(), m);
    });
    it('throw if num is 0', async () => {
      await assertInvalidOpcode(instance.div(0, 30, 200));
    });
  });
  describe('sub', () => {
    it('5%', async () => {
      await instance.sub(5, 100, 155);
      let r = await instance.res();
      let m = 155 - calc(5, 100, 155);
      assert.equal(r.toNumber(), m);
    });
    it('48%', async () => {
      await instance.sub(48, 100, 233);
      let r = await instance.res();
      let m = 233 - calc(48, 100, 233);
      assert.equal(r.toNumber(), m);
    });
    it('0 if  105%', async () => {
      await instance.sub(105, 100, 200);
      let r = await instance.res();
      assert.equal(r.toNumber(), 0);
    });
    it('throw if den is 0', async () => {
      await assertInvalidOpcode(instance.sub(5, 0, 155));
    });
  });
  describe('add', () => {
    it('5%', async () => {
      await instance.add(5, 100, 255);
      let r = await instance.res();
      let m = 255 + calc(5, 100, 255);
      assert.equal(r.toNumber(), m);
    });
    it('105%', async () => {
      await instance.add(105, 100, 555);
      let r = await instance.res();
      let m = 555 + calc(105, 100, 555);
      assert.equal(r.toNumber(), m);
    });
    it('throw if den is 0', async () => {
      await assertInvalidOpcode(instance.add(5, 0, 155));
    });
  });
});
