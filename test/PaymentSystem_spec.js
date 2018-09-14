import getAccounts from './helpers/getAccounts';
import assertRevert from './helpers/assertRevert';
import waitEvents from './helpers/waitEvents';
import assertInvalidOpcode from './helpers/assertInvalidOpcode';
import latestBlock from './helpers/latestBlock';
const PaymentSystem = artifacts.require('./contracts/test/TestPaymentSystem.sol');

let instance, owner;

let initContract = async function () {
  instance = await PaymentSystem.new({ from: owner });
};

export const Paymode = Object.freeze({
  'Push': 0,
  'Pull': 1,
});

contract('PaymentSystem', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    await initContract();
  });
  describe('check initialization', () => {
    it('latestTime is 0', async () => {
      let r = await instance.latestTime();
      assert.equal(r.toString(10), 0);
    });
    it('latestKeyIndex is 0', async () => {
      let r = await instance.latestKeyIndex();
      assert.equal(r.toString(10), 0);
    });
    it('mode is Push', async () => {
      let r = await instance.paymode();
      assert.equal(r.toNumber(), Paymode.Push);
    });
  });
  describe('changePaymode', () => {
    it('throw on invalid pay mode', async () => {
      await assertInvalidOpcode(instance.changePaymodeTest(10));
    });
    it('set pull - throw if latestTime = 0', async () => {
      await instance.setMode(Paymode.Push);
      await instance.setLatestTime(0);
      await assertRevert(instance.changePaymodeTest(Paymode.Pull));
    });
    it('success set pull', async () => {
      await instance.setMode(Paymode.Push);
      await instance.setLatestTime(1);
      await instance.changePaymodeTest(Paymode.Pull);
      let r = await instance.paymode();
      assert.equal(r.toNumber(), Paymode.Pull);
    });
    it('success set push', async () => {
      await instance.changePaymodeTest(Paymode.Push);
      let r = await instance.paymode();
      assert.equal(r.toNumber(), Paymode.Push);
    });
    it('success set push, latestTime set to 0', async () => {
      await instance.setLatestTime(1);
      await instance.setMode(Paymode.Pull);
      await instance.changePaymodeTest(Paymode.Push);
      let m = await instance.paymode();
      assert.equal(m.toNumber(), Paymode.Push);
      let r = await instance.latestTime();
      assert.equal(r.toString(10), 0);
    });
    it('event LogPaymodeChanged push', async () => {
      await instance.setMode(Paymode.Pull);
      await instance.changePaymodeTest(Paymode.Push);
      let block = latestBlock();
      let logPaymodeChanged = instance.LogPaymodeChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logPaymodeChanged);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogPaymodeChanged');
      assert.equal(e.args.mode.toNumber(), Paymode.Push);
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
    });
    it('event LogPaymodeChanged pull', async () => {
      await instance.setMode(Paymode.Push);
      await instance.setLatestTime(1);
      await instance.changePaymodeTest(Paymode.Pull);
      let block = latestBlock();
      let logPaymodeChanged = instance.LogPaymodeChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logPaymodeChanged);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogPaymodeChanged');
      assert.equal(e.args.mode.toNumber(), Paymode.Pull);
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
    });
    it('no event LogPaymodeChanged if mode not changed', async () => {
      await instance.setLatestTime(1);
      await instance.changePaymodeTest(Paymode.Pull);
      let block = latestBlock();
      let logPaymodeChanged = instance.LogPaymodeChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logPaymodeChanged);
      assert.equal(logs.length, 0);
    });
  });
  describe('atPaymode', () => {
    context('Push', () => {
      it('throw', async () => {
        await instance.setMode(Paymode.Pull);
        await assertRevert(instance.atPaymodePush());
      });
      it('success', async () => {
        await instance.setMode(Paymode.Push);
        await instance.atPaymodePush();
      });
    });
    context('Pull', () => {
      it('throw', async () => {
        await instance.setMode(Paymode.Push);
        await assertRevert(instance.atPaymodePull());
      });
      it('success', async () => {
        await instance.setMode(Paymode.Pull);
        await instance.atPaymodePull();
      });
    });
  });
});
