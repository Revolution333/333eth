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
      assert.equal(r.toString(10), '1');
    });
    it('iterStart', async () => {
      let r = await instance.iterStart();
      assert.equal(r.toString(10), '1');
    });
    describe('throw if not owner', () => {
      it('insert', async () => {
        await assertRevert(instance.insert(addr1, 10, { from: addr1 }));
      });
      it('addRefBonus', async () => {
        await assertRevert(instance.addRefBonus(addr1, 10, { from: addr1 }));
      });
      it('addValue', async () => {
        await assertRevert(instance.addValue(addr1, 10, { from: addr1 }));
      });
      it('setPaymentTime', async () => {
        await assertRevert(instance.setPaymentTime(addr1, 10, { from: addr1 }));
      });
      it('setRefBonus', async () => {
        await assertRevert(instance.setRefBonus(addr1, 10, { from: addr1 }));
      });
    });

    describe('change state', () => {
      it('insert new success', async () => {
        await instance.insert(addr1, 1, { from: owner });
        let r = await instance.investorShortInfo(addr1);
        assert.equal(r[0].toString(10), '1');
      });
      it('contains inserted', async () => {
        let r = await instance.contains(addr1);
        assert.equal(r, true);
      });
      it('not contains', async () => {
        let r = await instance.contains(addr2);
        assert.equal(r, false);
      });
      it('dont insert if already contains', async () => {
        await instance.insert(addr1, 100, { from: owner });
        let r = await instance.investorShortInfo(addr1);
        assert.equal(r[0].toString(10), '1');
      });
      it('addRefBonus', async () => {
        await instance.addRefBonus(addr1, 1, { from: owner });
        let r = await instance.investorShortInfo(addr1);
        assert.equal(r[1].toString(10), '1');
      });
      it('dont addRefBonus if dont contains', async () => {
        await instance.addRefBonus(addr2, 100, { from: owner });
        let r = await instance.investorShortInfo(addr2);
        assert.equal(r[1].toString(10), '0');
      });
      it('addValue', async () => {
        await instance.addValue(addr1, 1, { from: owner });
        let r = await instance.investorShortInfo(addr1);
        assert.equal(r[0].toString(10), '2');
      });
      it('dont addValue if dont contains', async () => {
        await instance.addValue(addr2, 100, { from: owner });
        let r = await instance.investorShortInfo(addr2);
        assert.equal(r[0].toString(10), '0');
      });
      it('setPaymentTime', async () => {
        await instance.setPaymentTime(addr1, 3, { from: owner });
        let r = await instance.investorBaseInfo(addr1);
        assert.equal(r[1].toString(10), '3');
      });
      it('dont setPaymentTime if dont contains', async () => {
        await instance.setPaymentTime(addr2, 100, { from: owner });
        let r = await instance.investorBaseInfo(addr2);
        assert.equal(r[1].toString(10), '0');
      });
      it('setRefBonus', async () => {
        await instance.setRefBonus(addr1, 5, { from: owner });
        let r = await instance.investorShortInfo(addr1);
        assert.equal(r[1].toString(10), '5');
      });
      it('dont setRefBonus if dont contains', async () => {
        await instance.setRefBonus(addr2, 100, { from: owner });
        let r = await instance.investorShortInfo(addr2);
        assert.equal(r[1].toString(10), '0');
      });
    });
    describe('info', () => {
      before(async () => {
        await instance.insert(addr2, 1, { from: owner });
        await instance.setPaymentTime(addr2, 2, { from: owner });
        await instance.setRefBonus(addr2, 3, { from: owner });
      });
      it('investorFullInfo', async () => {
        let r = await instance.investorFullInfo(addr2);
        assert.equal(r[0].toString(10), '2');
        assert.equal(r[1].toString(10), '1');
        assert.equal(r[2].toString(10), '2');
        assert.equal(r[3].toString(10), '3');
      });
      it('investorBaseInfo', async () => {
        let r = await instance.investorBaseInfo(addr2);
        assert.equal(r[0].toString(10), '1');
        assert.equal(r[1].toString(10), '2');
        assert.equal(r[2].toString(10), '3');
      });
      it('investorShortInfo', async () => {
        let r = await instance.investorShortInfo(addr2);
        assert.equal(r[0].toString(10), '1');
        assert.equal(r[1].toString(10), '3');
      });
    });
  });
});
