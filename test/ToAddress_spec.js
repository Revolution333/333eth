import getAccounts from './helpers/getAccounts';
import { ZERO_ADDRESS } from './helpers/zeroAddress';
const ToAddress = artifacts.require('./contracts/test/TestToAddress.sol');

let instance, owner;

let initContract = async function () {
  instance = await ToAddress.new({ from: owner });
};

contract('ToAddress', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    await initContract();
  });
      
  describe('uint.toAddr', () => {
    it('100', async () => {
      let r = await instance.toAddr(100);
      assert.equal(r.toLowerCase(), '0x0000000000000000000000000000000000000064'.toLowerCase());
    });
  });
  describe('bytes.toAddr', () => {
    it('empty to zero addr', async () => {
      let r = await instance.bytesToAddr('');
      assert.equal(r.toLowerCase(), ZERO_ADDRESS.toLowerCase());
    });
    it('0x311f71389e3DE68f7B2097Ad02c6aD7B2dDE4C71', async () => {
      let r = await instance.bytesToAddr('0x311f71389e3DE68f7B2097Ad02c6aD7B2dDE4C71');
      assert.equal(r.toLowerCase(), '0x311f71389e3DE68f7B2097Ad02c6aD7B2dDE4C71'.toLowerCase());
    });
    it('latest symbol is 0 0x311f71389e3DE68f7B2097Ad02c6aD7B2dDE4C70', async () => {
      let r = await instance.bytesToAddr('0x311f71389e3DE68f7B2097Ad02c6aD7B2dDE4C70');
      assert.equal(r.toLowerCase(), '0x311f71389e3DE68f7B2097Ad02c6aD7B2dDE4C70'.toLowerCase());
    });
  });
});
