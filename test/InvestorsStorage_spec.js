import getAccounts from './helpers/getAccounts';
import assertRevert from './helpers/assertRevert';
const InvestorsStorage = artifacts.require('./contracts/InvestorsStorage.sol');

let instance, owner, addr1, addr2;

let initContract = async function () {
  instance = await InvestorsStorage.new({ from: owner });
};

contract('InvestorsStorage', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    addr1 = accs[1];
    addr2 = accs[2];
  });
    
  describe('check initialization', () => {
    before(async () => {
      await initContract();
    });
    it('size', async () => {
      let r = await instance.size();
      assert.equal(r.toString(10), '0');
    });
    describe('throw if not owner', () => {
      it('newInvestor', async () => {
        await assertRevert(instance.newInvestor(addr1, 10, 10, { from: addr1 }));
      });
      it('addInvestment', async () => {
        await assertRevert(instance.addInvestment(addr1, 10, { from: addr1 }));
      });
      it('setPaymentTime', async () => {
        await assertRevert(instance.setPaymentTime(addr1, 10, { from: addr1 }));
      });
    });

    describe('change state', () => {
      it('newInvestor success', async () => {
        await instance.newInvestor(addr1, 1, 2, { from: owner });
        let r = await instance.investorInfo(addr1);
        assert.equal(r[0].toString(10), '1');
        assert.equal(r[1].toString(10), '2');
      });
      it('size', async () => {
        let r = await instance.size();
        assert.equal(r.toString(10), '1');
      });
      it('isInvestor', async () => {
        let r = await instance.isInvestor(addr1);
        assert.equal(r, true);
      });
      it('not isInvestor', async () => {
        let r = await instance.isInvestor(addr2);
        assert.equal(r, false);
      });
      it('dont newInvestor if already contains', async () => {
        await instance.newInvestor(addr1, 100, 100, { from: owner });
        let r = await instance.investorInfo(addr1);
        assert.equal(r[0].toString(10), '1');
        assert.equal(r[1].toString(10), '2');
      });
      it('addInvestment', async () => {
        await instance.addInvestment(addr1, 1, { from: owner });
        let r = await instance.investorInfo(addr1);
        assert.equal(r[0].toString(10), '2');
      });
      it('dont addInvestment if dont contains', async () => {
        await instance.addInvestment(addr2, 100, { from: owner });
        let r = await instance.investorInfo(addr2);
        let r1 = await instance.isInvestor(addr2);
        assert.equal(r1, false);
        assert.equal(r[0].toString(10), '0');
      });
      it('setPaymentTime', async () => {
        await instance.setPaymentTime(addr1, 3, { from: owner });
        let r = await instance.investorInfo(addr1);
        assert.equal(r[1].toString(10), '3');
      });
      it('dont setPaymentTime if dont contains', async () => {
        await instance.setPaymentTime(addr2, 100, { from: owner });
        let r = await instance.investorInfo(addr2);
        let r1 = await instance.isInvestor(addr2);
        assert.equal(r1, false);
        assert.equal(r[1].toString(10), '0');
      });
    });
  });
});
