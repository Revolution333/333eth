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

  describe('storage', () => {
    context('mul', () => {
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
    context('div', () => {
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
    context('sub', () => {
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
    context('add', () => {
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

  describe('memory', () => {
    context('mul', () => {
      it('5%', async () => {
        let r = await instance.mmul(5, 100, 200);
        let m = calc(5, 100, 200);
        assert.equal(r.toNumber(), m);
      });
      it('105%', async () => {
        let r = await instance.mmul(105, 100, 777);
        let m = calc(105, 100, 777);
        assert.equal(r.toNumber(), m);
      });
      it('return 0 if val 0', async () => {
        let r = await instance.mmul(5, 100, 0);
        assert.equal(r.toNumber(), 0);
      });
      it('throw if den is 0', async () => {
        await assertInvalidOpcode(instance.mmul(5, 0, 200));
      });
    });
    context('div', () => {
      it('5%', async () => {
        let r = await instance.mdiv(5, 100, 155);
        let m = calc(100, 5, 155);
        assert.equal(r.toNumber(), m);
      });
      it('105%', async () => {
        let r = await instance.mdiv(5, 100, 300);
        let m = calc(100, 5, 300);
        assert.equal(r.toNumber(), m);
      });
      it('throw if num is 0', async () => {
        await assertInvalidOpcode(instance.mdiv(0, 30, 200));
      });
    });
    context('sub', () => {
      it('5%', async () => {
        let r = await instance.msub(5, 100, 155);
        let m = 155 - calc(5, 100, 155);
        assert.equal(r.toNumber(), m);
      });
      it('48%', async () => {
        let r = await instance.msub(48, 100, 233);
        let m = 233 - calc(48, 100, 233);
        assert.equal(r.toNumber(), m);
      });
      it('0 if  105%', async () => {
        let r = await instance.msub(105, 100, 200);
        assert.equal(r.toNumber(), 0);
      });
      it('throw if den is 0', async () => {
        await assertInvalidOpcode(instance.msub(5, 0, 155));
      });
    });
    context('add', () => {
      it('5%', async () => {
        let r = await instance.madd(5, 100, 255);
        let m = 255 + calc(5, 100, 255);
        assert.equal(r.toNumber(), m);
      });
      it('105%', async () => {
        let r = await instance.madd(105, 100, 555);
        let m = 555 + calc(105, 100, 555);
        assert.equal(r.toNumber(), m);
      });
      it('throw if den is 0', async () => {
        await assertInvalidOpcode(instance.madd(5, 0, 155));
      });
    });
  });

  describe('storage to memory', () => {
    it('5 , 23', async () => {
      await instance.toMemory(5, 23);
      let num = await instance.snum();
      let den = await instance.sden();
      assert.equal(num.toString(10), '5');
      assert.equal(den.toString(10), '23');
    });
  });
});
