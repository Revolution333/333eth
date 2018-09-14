import getAccounts from './helpers/getAccounts';
import assertRevert from './helpers/assertRevert';
import waitEvents from './helpers/waitEvents';
import assertInvalidOpcode from './helpers/assertInvalidOpcode';
import latestBlock from './helpers/latestBlock';
const Accessibility = artifacts.require('./contracts/test/TestAccessibility.sol');

let instance, owner, addr1, addr2, addr3, addr4;

let initContract = async function () {
  instance = await Accessibility.new({ from: owner });
};

export const AccessRank = Object.freeze({
  'None': 0,
  'Payout': 1,
  'Paymode': 2,
  'Full': 3,
});

contract('Accessibility', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    addr1 = accs[1];
    addr2 = accs[2];
    addr3 = accs[3];
    addr4 = accs[4];
    await initContract();
  });
  describe('check initialization', () => {
    it('event LogProvideAccess on create', async () => {
      let block = latestBlock();
      let logProvideAccess = instance.LogProvideAccess({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logProvideAccess);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogProvideAccess');
      assert.equal(e.args.whom.toLowerCase(), owner.toLowerCase());
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.rank.toNumber(), AccessRank.Full);
    });
    it('owner has full access rank', async () => {
      let r = await instance.access(owner);
      assert.equal(r.toNumber(), AccessRank.Full);
    });
  });
  describe('provideAccess', () => {
    it('throw access denied', async () => {
      await assertRevert(instance.provideAccess(addr2, AccessRank.Full, { from: addr1 }));
      await assertRevert(instance.provideAccess(addr2, AccessRank.Paymode, { from: addr1 }));
    });
    it('throw invalid access rank', async () => {
      await assertInvalidOpcode(instance.provideAccess(addr2, 10, { from: owner }));
      await assertInvalidOpcode(instance.provideAccess(addr2, 23, { from: owner }));
    });
    it('success', async () => {
      await instance.provideAccess(addr1, AccessRank.Full, { from: owner });
      await instance.provideAccess(addr2, AccessRank.Paymode, { from: owner });
      await instance.provideAccess(addr3, AccessRank.Payout, { from: owner });
      let r1 = await instance.access(addr1);
      let r2 = await instance.access(addr2);
      let r3 = await instance.access(addr3);
      assert.equal(r1.toNumber(), AccessRank.Full);
      assert.equal(r2.toNumber(), AccessRank.Paymode);
      assert.equal(r3.toNumber(), AccessRank.Payout);
    });
    it('throw cannot change full access rank', async () => {
      await assertRevert(instance.provideAccess(addr1, AccessRank.Paymode, { from: owner }));
    });
    it('event LogProvideAccess', async () => {
      await instance.provideAccess(addr3, AccessRank.Paymode, { from: owner });
      let block = latestBlock();
      let logProvideAccess = instance.LogProvideAccess({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logProvideAccess);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogProvideAccess');
      assert.equal(e.args.whom.toLowerCase(), addr3.toLowerCase());
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.rank.toNumber(), AccessRank.Paymode);
    });
    it('no event LogProvideAccess if rank not changed', async () => {
      await instance.provideAccess(addr3, AccessRank.Paymode, { from: owner });
      let block = latestBlock();
      let logProvideAccess = instance.LogProvideAccess({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logProvideAccess);
      assert.equal(logs.length, 0);
    });
  });
  describe('onlyAdmin', () => {
    before(async function () {
      await instance.provideAccess(addr2, AccessRank.Paymode, { from: owner });
      await instance.provideAccess(addr3, AccessRank.Payout, { from: owner });
    });
    context('None', () => {
      it('success', async () => {
        await instance.accessRankNone({ from: addr4 });
      });
    });
    context('Payout', () => {
      it('throw', async () => {
        await assertRevert(instance.accessRankPayout({ from: addr4 }));
        await assertRevert(instance.accessRankPayout({ from: addr2 }));
      });
      it('success', async () => {
        await instance.accessRankPayout({ from: addr3 });
      });
      it('success if full', async () => {
        await instance.accessRankPayout({ from: owner });
      });
    });
    context('Paymode', () => {
      it('throw', async () => {
        await assertRevert(instance.accessRankPaymode({ from: addr4 }));
        await assertRevert(instance.accessRankPaymode({ from: addr3 }));
      });
      it('success', async () => {
        await instance.accessRankPaymode({ from: addr2 });
      });
      it('success if full', async () => {
        await instance.accessRankPaymode({ from: owner });
      });
    });
    context('Full', () => {
      it('success', async () => {
        await instance.accessRankFull({ from: addr1 });
        await instance.accessRankFull({ from: owner });
      });
      it('throw', async () => {
        await assertRevert(instance.accessRankFull({ from: addr4 }));
        await assertRevert(instance.accessRankFull({ from: addr2 }));
        await assertRevert(instance.accessRankFull({ from: addr3 }));
      });
    });
  });
});
