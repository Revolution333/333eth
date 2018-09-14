import getAccounts from './helpers/getAccounts';
import assertRevert from './helpers/assertRevert';
import { ZERO_ADDRESS } from './helpers/zeroAddress';
const Zero = artifacts.require('./contracts/test/TestZero.sol');

let instance, owner;

let initContract = async function () {
  instance = await Zero.new({ from: owner });
};

contract('Zero', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    await initContract();
  });
      
  describe('uint.requireNotZero', () => {
    it('throw on zero', async () => {
      await assertRevert(instance.requireNotZeroUint(0));
    });
    it('ok on not zero', async () => {
      await instance.requireNotZeroUint(1);
    });
  });
  describe('address.requireNotZero', () => {
    it('throw on zero', async () => {
      await assertRevert(instance.requireNotZeroAddr(ZERO_ADDRESS));
    });
    it('ok on not zero', async () => {
      await instance.requireNotZeroAddr(instance.address);
    });
  });
  describe('address.notZero', () => {
    it('not zero - true', async () => {
      let r = await instance.notZero(instance.address);
      assert.equal(r, true);
    });
    it('zero - false', async () => {
      let r = await instance.notZero(ZERO_ADDRESS);
      assert.equal(r, false);
    });
  });
  describe('address.isZero', () => {
    it('zero - true', async () => {
      let r = await instance.isZero(ZERO_ADDRESS);
      assert.equal(r, true);
    });
    it('not zero - false', async () => {
      let r = await instance.isZero(instance.address);
      assert.equal(r, false);
    });
  });
});
