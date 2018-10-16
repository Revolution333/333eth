import increaseTime, { duration } from './helpers/increaseTime';
import checkPublicABI from './helpers/checkPublicABI';
import ether from './helpers/ether';
import latestGasUsed from './helpers/latestGasUsed';
import latestTime from './helpers/latestTime';
import latestBlock from './helpers/latestBlock';
import assertRevert from './helpers/assertRevert';
import BigNumber from 'bignumber.js';
import { ZERO_ADDRESS } from './helpers/zeroAddress';
import { gasPrice } from './helpers/gasPrice';
import getBalance from './helpers/getBalance';
import sendTransaction from './helpers/sendTransaction';
import waitEvents from './helpers/waitEvents';

const Revolution2 = artifacts.require('./contracts/Revolution2.sol');
const TestRevolution2 = artifacts.require('./contracts/tests/TestRevolution2.sol');
const MockDoInvest = artifacts.require('./contracts/mocks/MockDoInvest.sol');
const MockGetMyDividends = artifacts.require('./contracts/mocks/MockGetMyDividends.sol');
const MockRev1Storage = artifacts.require('./contracts/mocks/MockRev1Storage.sol');

let instance, creationTime, investment, mockRev1Storage;
let initContract = async function (owner) {
  instance = await Revolution2.new({ from: owner });
  creationTime = await latestTime();
};

function Percent (num, den) {
  this.num = num;
  this.den = den;
  this.interval = duration.minutes(10);
}
Percent.prototype.calcDividends = function (inv, dur) {
  let r = new BigNumber(inv);
  return r
    .multipliedBy(this.num)
    .dividedToIntegerBy(this.den)
    .multipliedBy(Math.floor(dur / this.interval))
    .dividedToIntegerBy(144);
};
Percent.prototype.assertEqual = function (percent) {
  assert.equal(percent[0].toString(), '' + this.num);
  assert.equal(percent[1].toString(), '' + this.den);
};
Percent.prototype.mul = function (val) {
  return new BigNumber(val).multipliedBy(this.num).dividedToIntegerBy(this.den);
};
Percent.prototype.string = function () {
  return `${(100 * this.num / this.den).toFixed(2)}%`;
};
const p1 = new Percent(1, 100);
const p2 = new Percent(2, 100);
const p3_33 = new Percent(333, 10000); // eslint-disable-line camelcase
const p5 = new Percent(5, 100);
const p7_5 = new Percent(75, 1000); // eslint-disable-line camelcase

let prepareToNextWave = async function (addr) {
  await instance.doInvest(ZERO_ADDRESS, { from: addr, value: ether(1) });
  await increaseTime(duration.days(26));
  await instance.getMyDividends({ from: addr });
  await increaseTime(duration.days(1));
};

contract('Revolution2', function ([_, owner, addr1, addr2, addr3, addr4]) {
  describe('check initialization', () => {
    before(async () => {
      await initContract(owner);
    });
    it('has a limited public ABI', () => {
      let expectedABI = [
        'advertisingAddress',
        'adminsAddress',
        'investmentsNumber',
        'waveStartup',
        'minInvesment',
        'maxBalance',
        'investorsNumber',
        'balanceETH',
        'percent1',
        'percent2',
        'percent3_33',
        'advertisingPercent',
        'adminsPercent',
        'investorInfo',
        'investorDividendsAtNow',
        'dailyPercentAtNow',
        'refBonusPercentAtNow',
        'getMyDividends',
        'doInvest',
        'setAdvertisingAddress',
        'setAdminsAddress',
        'doDisown',
        'init',
        'privateEntranceProvideAccessFor',
        'rapidGrowthProtectionmMaxInvestmentAtNow',
      ];
      checkPublicABI(Revolution2, expectedABI);
    });
    it('advertisingAddress', async () => {
      let a = await instance.advertisingAddress({ from: addr1 });
      assert.equal(a.toLowerCase(), owner.toLowerCase());
    });
    it('adminsAddress', async () => {
      let a = await instance.adminsAddress({ from: addr1 });
      assert.equal(a.toLowerCase(), owner.toLowerCase());
    });
    it('investmentsNumber', async () => {
      let a = await instance.investmentsNumber({ from: addr1 });
      assert.equal(a.toString(10), '0');
    });
    it('waveStartup', async () => {
      let a = await instance.waveStartup({ from: addr1 });
      assert.equal(a.toString(10), creationTime.toString(10));
    });
    it('minInvesment', async () => {
      let a = await instance.minInvesment({ from: addr1 });
      assert.equal(a.toString(10), ether(0.01).toString(10));
    });
    it('maxBalance', async () => {
      let a = await instance.maxBalance({ from: addr1 });
      assert.equal(a.toString(10), ether(33300000).toString(10));
    });
    it('investorsNumber', async () => {
      let a = await instance.investorsNumber({ from: addr1 });
      assert.equal(a.toString(10), '0');
    });
    it('balanceETH', async () => {
      let a = await instance.balanceETH({ from: addr1 });
      assert.equal(a.toString(10), '0');
    });
    it('percent1', async () => {
      let a = await instance.percent1({ from: addr1 });
      p1.assertEqual(a);
    });
    it('percent2', async () => {
      let a = await instance.percent2({ from: addr1 });
      p2.assertEqual(a);
    });
    it('percent3_33', async () => {
      let a = await instance.percent3_33({ from: addr1 });
      p3_33.assertEqual(a); // eslint-disable-line camelcase
    });
    it('advertisingPercent', async () => {
      let a = await instance.advertisingPercent({ from: addr1 });
      p7_5.assertEqual(a); // eslint-disable-line camelcase
    });
    it('adminsPercent', async () => {
      let a = await instance.adminsPercent({ from: addr1 });
      p5.assertEqual(a);
    });
  });

  describe('change state', () => {
    before(async () => {
      await initContract(owner);
    });
    context('setAdvertisingAddress', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.setAdvertisingAddress(addr1, { from: addr1 }));
        let a = await instance.advertisingAddress({ from: addr2 });
        assert.equal(a.toLowerCase(), owner.toLowerCase());
      });
      it('change state', async () => {
        await instance.setAdvertisingAddress(addr1, { from: owner });
        let a = await instance.advertisingAddress({ from: addr2 });
        assert.equal(a.toLowerCase(), addr1.toLowerCase());
      });
    });
    context('setAdminsAddress', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.setAdminsAddress(addr1, { from: addr1 }));
        let a = await instance.adminsAddress({ from: addr2 });
        assert.equal(a.toLowerCase(), owner.toLowerCase());
      });
      it('change state', async () => {
        await instance.setAdminsAddress(addr2, { from: owner });
        let a = await instance.adminsAddress({ from: addr1 });
        assert.equal(a.toLowerCase(), addr2.toLowerCase());
      });
    });
    context('init', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.init(addr2, 10, { from: addr1 }));
      });
      it('change state', async () => {
        let b = await latestBlock();
        await instance.init(addr2, b.timestamp - 10, { from: owner });
        let r = await instance.rapidGrowthProtectionmMaxInvestmentAtNow({ from: addr1 });
        assert.equal(r.toString(10), ether(500).toString(10));
      });
      it('event LogPEInit', async () => {
        await instance.init(addr2, 10, { from: owner });
        let block = await latestBlock();
        let logPEInit = instance.LogPEInit({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logPEInit);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogPEInit');
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
        assert.equal(e.args.rev1Storage.toLowerCase(), addr2.toLowerCase());
        // assert.equal(e.args.rev2Storage.toString(10), block.timestamp.toString(10));
        assert.equal(e.args.investorMaxInvestment.toString(10), ether(50).toString(10));
        assert.equal(e.args.endTimestamp.toString(10), '10');
      });
      it('event LogRGPInit', async () => {
        await instance.init(addr2, 10, { from: owner });
        let block = await latestBlock();
        let logRGPInit = instance.LogRGPInit({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logRGPInit);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogRGPInit');
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
        assert.equal(e.args.startTimestamp.toString(10), '11');
        assert.equal(e.args.maxDailyTotalInvestment.toString(10), ether(500).toString(10));
        assert.equal(e.args.activityDays.toString(10), '21');
      });
    });
    context('privateEntranceProvideAccessFor', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.privateEntranceProvideAccessFor([addr1], { from: addr1 }));
      });
    });
    context('doDisown', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.doDisown({ from: addr1 }));
      });
      it('change state', async () => {
        await instance.doDisown({ from: owner });
      });
      it('event LogDisown', async () => {
        let block = await latestBlock();
        let logDisown = instance.LogDisown({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logDisown);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogDisown');
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      });
      it('access denied', async () => {
        await assertRevert(instance.doDisown({ from: owner }));
      });
    });
  });

  describe('test internal methods', () => {
    context('getMemInvestor', () => {
      before(async () => {
        instance = await TestRevolution2.new({ from: owner });
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(1) });
      });
      it('return zero investor if not existing', async () => {
        let inv = await instance.testGetMemInvestor(addr2);
        assert.equal(inv[0].toString(10), '0');
        assert.equal(inv[1].toString(10), '0');
      });
      it('return correct investor info', async () => {
        let inv = await instance.testGetMemInvestor(addr1);
        let ltime = await latestTime();
        assert.equal(inv[0].toString(10), ether(1).toString(10));
        assert.equal(inv[1].toString(10), ltime.toString(10));
      });
    });
    context('dailyPercent', () => {
      beforeEach(async () => {
        instance = await TestRevolution2.new({ from: owner });
      });
      it('bank 100 eth is ' + p3_33.string(), async () => { // eslint-disable-line camelcase
        await instance.receiveEther({ from: addr1, value: ether(100) });
        let p = await instance.dailyPercentAtNow();
        p3_33.assertEqual(p); // eslint-disable-line camelcase
      });
      it('bank 999 eth is ' + p3_33.string(), async () => { // eslint-disable-line camelcase
        await instance.receiveEther({ from: addr1, value: ether(999) });
        let p = await instance.dailyPercentAtNow();
        p3_33.assertEqual(p); // eslint-disable-line camelcase
      });
      it('bank 1000 eth is ' + p2.string(), async () => {
        await instance.receiveEther({ from: addr1, value: ether(1000) });
        let p = await instance.dailyPercentAtNow();
        p2.assertEqual(p);
      });
      it('bank 10000 eth is ' + p2.string(), async () => {
        await instance.receiveEther({ from: addr1, value: ether(10000) });
        let p = await instance.dailyPercentAtNow();
        p2.assertEqual(p);
      });
      it('bank 33333 eth is ' + p2.string(), async () => {
        await instance.receiveEther({ from: addr1, value: ether(33333) });
        let p = await instance.dailyPercentAtNow();
        p2.assertEqual(p);
      });
      it('bank 33334 eth is ' + p3_33.string(), async () => { // eslint-disable-line camelcase
        await instance.receiveEther({ from: addr1, value: ether(33334) });
        let p = await instance.dailyPercentAtNow();
        p1.assertEqual(p);
      });
    });
    context('refBonusPercent', () => {
      beforeEach(async () => {
        instance = await TestRevolution2.new({ from: owner });
      });
      it('bank 100 001 eth is ' + p1.string(), async () => {
        await instance.receiveEther({ from: addr1, value: ether(100001) });
        let p = await instance.refBonusPercentAtNow();
        p1.assertEqual(p);
      });
      it('bank 10 000  eth is ' + p2.string(), async () => {
        await instance.receiveEther({ from: addr1, value: ether(10000) });
        let p = await instance.refBonusPercentAtNow();
        p2.assertEqual(p);
      });
      it('bank 100 000 eth is ' + p2.string(), async () => {
        await instance.receiveEther({ from: addr1, value: ether(100000) });
        let p = await instance.refBonusPercentAtNow();
        p2.assertEqual(p);
      });
      it('bank 20 000 eth is ' + p2.string(), async () => {
        await instance.receiveEther({ from: addr1, value: ether(20000) });
        let p = await instance.refBonusPercentAtNow();
        p2.assertEqual(p);
      });
      it('bank 9 999 eth is ' + p3_33.string(), async () => { // eslint-disable-line camelcase
        await instance.receiveEther({ from: addr1, value: ether(9999) });
        let p = await instance.refBonusPercentAtNow();
        p3_33.assertEqual(p); // eslint-disable-line camelcase
      });
      it('bank 2000 eth is ' + p3_33.string(), async () => { // eslint-disable-line camelcase
        await instance.receiveEther({ from: addr1, value: ether(2000) });
        let p = await instance.refBonusPercentAtNow();
        p3_33.assertEqual(p); // eslint-disable-line camelcase
      });
    });
    context('calcDividends', () => {
      beforeEach(async () => {
        instance = await TestRevolution2.new({ from: owner });
        investment = ether(1);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
      });
      context(p3_33.string() + ' daily', () => { // eslint-disable-line camelcase
        beforeEach(async () => {
          // go to 3.33%
          await instance.receiveEther({ from: addr1, value: ether(999) });
        });
        it('0 if payment was less then 10 min', async () => {
          await increaseTime(duration.minutes(6));
          let r = await instance.investorDividendsAtNow(addr1);
          assert.equal(r.toString(10), '0');
        });
        it('0 if not investor', async () => {
          let r = await instance.investorDividendsAtNow(addr2);
          assert.equal(r.toString(10), '0');
        });
        it('after 1 day', async () => {
          let d = duration.days(1) + 100;
          await increaseTime(d);
          let r = await instance.investorDividendsAtNow(addr1);
          // eslint-disable-next-line camelcase
          assert.equal(r.toString(10), p3_33.calcDividends(investment, d).toString(10));
        });
        it('after 15 min', async () => {
          let d = duration.minutes(15) + 100;
          await increaseTime(d);
          let r = await instance.investorDividendsAtNow(addr1);
          // eslint-disable-next-line camelcase
          assert.equal(r.toString(10), p3_33.calcDividends(investment, d).toString(10));
        });
        it('after 5 days and 3 hours', async () => {
          let d = duration.hours(3) + duration.days(5) + 100;
          await increaseTime(d);
          let r = await instance.investorDividendsAtNow(addr1);
          // eslint-disable-next-line camelcase
          assert.equal(r.toString(10), p3_33.calcDividends(investment, d).toString(10));
        });
      });
      context(p2.string() + ' daily', () => {
        beforeEach(async () => {
          // go to 2.22%
          await instance.receiveEther({ from: addr1, value: ether(1000) });
        });
        it('after 2 days and 3 hours', async () => {
          let d = duration.hours(3) + duration.days(2) + 100;
          await increaseTime(d);
          let r = await instance.investorDividendsAtNow(addr1);
          assert.equal(r.toString(10), p2.calcDividends(investment, d).toString(10));
        });
      });
      context(p1.string() + ' daily', () => {
        beforeEach(async () => {
          // go to 1.11%
          await instance.receiveEther({ from: addr2, value: ether(33334) });
        });
        it('after 3 hours', async () => {
          let d = duration.hours(3) + 100;
          await increaseTime(d);
          let r = await instance.investorDividendsAtNow(addr1);
          assert.equal(r.toString(10), p1.calcDividends(investment, d).toString(10));
        });
      });
    });
  });
  describe('doInvest(address referrerAddr)', () => {
    beforeEach(async () => {
      instance = await TestRevolution2.new({ from: owner });
      investment = await instance.minInvesment();
    });
    it('throw on low msg.value', async () => {
      let inv = new BigNumber(investment.toString(10)).minus(1);
      await assertRevert(instance.doInvest(ZERO_ADDRESS, { from: addr1, value: inv.toString(10) }));
    });
    it('throw on max balance limit', async () => {
      let max = await instance.maxBalance();
      max = max.dividedToIntegerBy(2);
      await instance.receiveEther({ from: addr3, value: max.plus(1) });
      await instance.receiveEther({ from: addr4, value: max.plus(1) });
      await assertRevert(instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment }));
    });
    it('throw if from contract', async () => {
      let mockDoInvest = await MockDoInvest.new({ from: owner });
      await assertRevert(mockDoInvest.doInvest(instance.address, ZERO_ADDRESS, { from: addr1, value: investment }));
    });
    it('success with valid msg.value', async () => {
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
    });
    context('Rapid Growth Protection', () => {
      beforeEach(async () => {
        let t = await latestTime();
        await instance.init(addr1, t, { from: owner });
        await increaseTime(duration.minutes(1));
      });
      it('check if ivestment saved at some day', async () => {
        let r = await instance.rapidGrowthProtectionmMaxInvestmentAtNow();
        assert.equal(r.toString(10), ether(500).toString());

        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });

        r = await instance.rapidGrowthProtectionmMaxInvestmentAtNow();
        let mustBe = new BigNumber(ether(500).toString(10)).minus(investment);

        assert.equal(r.toString(10), mustBe.toString(10));
      });
      it('check if ivestment saved for correct day', async () => {
        let r = await instance.rapidGrowthProtectionmMaxInvestmentAtNow();
        assert.equal(r.toString(10), ether(500).toString());

        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });

        r = await instance.rapidGrowthProtectionmMaxInvestmentAtNow();
        let mustBe = new BigNumber(ether(500).toString(10)).minus(investment);
        assert.equal(r.toString(10), mustBe.toString(10));

        await increaseTime(duration.days(1));
        r = await instance.rapidGrowthProtectionmMaxInvestmentAtNow();
        assert.equal(r.toString(10), ether(500).toString());
      });
      it('throw if limit 500 eth passed', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(500) });

        let r = await instance.rapidGrowthProtectionmMaxInvestmentAtNow();
        assert.equal(r.toString(10), '0');

        await assertRevert(instance.doInvest(ZERO_ADDRESS, { from: addr2, value: investment }));
      });
      context('return excess of ether', () => {
        beforeEach(async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(1) });
        });
        it('check correct investor info', async () => {
          let r = await instance.investorInfo(addr2);
          assert.equal(r[0].toString(), '0');
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(500) });
          r = await instance.investorInfo(addr2);
          assert.equal(r[0].toString(10), ether(499).toString(10));
        });
        it('is correct returned ether', async () => {
          let bb = await getBalance(addr2);
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(500) });
          let txCost = await latestGasUsed();
          txCost *= gasPrice;
          let ba = await getBalance(addr2);
          let mustBe = new BigNumber(bb.toString(10)).minus(ether(499)).minus(txCost);
          assert.equal(ba.toString(10), mustBe.toString(10));
        });
        it('event LogSendExcessOfEther', async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(500) });
          let block = await latestBlock();
          let logSendExcessOfEther = instance.LogSendExcessOfEther({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          // eslint-disable-next-line camelcase
          const logs = await waitEvents(logSendExcessOfEther);
          assert.equal(logs.length, 1);
          let e = logs[0];
        
          assert.equal(e.event, 'LogSendExcessOfEther');
          assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.value.toString(10), ether(500).toString(10));
          assert.equal(e.args.investment.toString(10), ether(499).toString(10));
          assert.equal(e.args.excess.toString(10), ether(1).toString(10));
        });
        it('correct event LogNewInvesment', async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(500) });
          let block = await latestBlock();
          let LogNewInvesment = instance.LogNewInvesment({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(LogNewInvesment);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogNewInvesment');
          assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.investment.toString(10), ether(499).toString(10));
          assert.equal(e.args.value.toString(10), ether(499).toString(10));
        });
        it('correct referrer event LogNewReferral', async () => {
          let currp = await instance.refBonusPercentAtNow();
          let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
          let mustBe = pp.mul(ether(499));
          await instance.doInvest(addr1, { from: addr2, value: ether(500) });
          let block = await latestBlock();
          let logNewReferral = instance.LogNewReferral({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(logNewReferral);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogNewReferral');
          assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.referrerAddr.toLowerCase(), addr1.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.refBonus.toString(10), mustBe.toString(10));
        });
      });
      it('not active if 21 days left', async () => {
        await increaseTime(duration.days(22));
        await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(501) });
        let r = await instance.investorInfo(addr2);
        assert.equal(r[0].toString(10), ether(501).toString(10));
      });
      it('event LogRGPInvestment', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(500) });
        let block = await latestBlock();
        let logRGPInvestment = instance.LogRGPInvestment({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logRGPInvestment);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogRGPInvestment');
        assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
        assert.equal(e.args.investment.toString(10), ether(500).toString(10));
        assert.equal(e.args.day.toString(10), '1');
      });
    });
    context('Private Entrance', () => {
      beforeEach(async () => {
        let t = await latestTime();
        mockRev1Storage = await MockRev1Storage.new({ from: owner });
        await instance.init(mockRev1Storage.address, t + duration.days(1), { from: owner });
      });
      it('throw if investor dont has access', async () => {
        await mockRev1Storage.setInvestor(addr1, ether(100), 0);
        await assertRevert(instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(50) }));
      });
      it('throw if investor dont to invest to revolution 1', async () => {
        await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
        await assertRevert(instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(50) }));
      });
      it('success invest', async () => {
        await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
        await mockRev1Storage.setInvestor(addr1, ether(100), 0);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(5) });
        let r = await instance.investorInfo(addr1);
        assert.equal(r[0].toString(10), ether(5).toString(10));
      });
      it('throw if limit 50 eth passed', async () => {
        await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
        await mockRev1Storage.setInvestor(addr1, ether(100), 0);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(50) });
        await assertRevert(instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(50) }));
        let r = await instance.investorInfo(addr1);
        assert.equal(r[0].toString(10), ether(50).toString(10));
      });
      it('check invest limit 50 eth', async () => {
        await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
        await mockRev1Storage.setInvestor(addr1, ether(100), 0);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(100) });
        let r = await instance.investorInfo(addr1);
        assert.equal(r[0].toString(10), ether(50).toString(10));
      });

      it('check invest limit revolution 1', async () => {
        await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
        await mockRev1Storage.setInvestor(addr1, ether(20), 0);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(30) });
        let r = await instance.investorInfo(addr1);
        assert.equal(r[0].toString(10), ether(20).toString(10));
      });
      context('return excess of ether', () => {
        beforeEach(async () => {
          await instance.privateEntranceProvideAccessFor([addr2], { from: owner });
          await mockRev1Storage.setInvestor(addr2, ether(20), 0);

          await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
          await mockRev1Storage.setInvestor(addr1, ether(20), 0);
          await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(20) });
        });
        it('check correct investor info', async () => {
          let r = await instance.investorInfo(addr2);
          assert.equal(r[0].toString(), '0');
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(21) });
          r = await instance.investorInfo(addr2);
          assert.equal(r[0].toString(10), ether(20).toString(10));
        });
        it('is correct returned ether', async () => {
          let bb = await getBalance(addr2);
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(21) });
          let txCost = await latestGasUsed();
          txCost *= gasPrice;
          let ba = await getBalance(addr2);
          let mustBe = new BigNumber(bb.toString(10)).minus(ether(20)).minus(txCost);
          assert.equal(ba.toString(10), mustBe.toString(10));
        });
        it('event LogSendExcessOfEther', async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(21) });
          let block = await latestBlock();
          let logSendExcessOfEther = instance.LogSendExcessOfEther({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          // eslint-disable-next-line camelcase
          const logs = await waitEvents(logSendExcessOfEther);
          assert.equal(logs.length, 1);
          let e = logs[0];
        
          assert.equal(e.event, 'LogSendExcessOfEther');
          assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.value.toString(10), ether(21).toString(10));
          assert.equal(e.args.investment.toString(10), ether(20).toString(10));
          assert.equal(e.args.excess.toString(10), ether(1).toString(10));
        });
        it('correct event LogNewInvesment', async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: ether(21) });
          let block = await latestBlock();
          let LogNewInvesment = instance.LogNewInvesment({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(LogNewInvesment);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogNewInvesment');
          assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.investment.toString(10), ether(20).toString(10));
          assert.equal(e.args.value.toString(10), ether(20).toString(10));
        });
        it('correct referrer event LogNewReferral', async () => {
          let currp = await instance.refBonusPercentAtNow();
          let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
          let mustBe = pp.mul(ether(20));
          await instance.doInvest(addr1, { from: addr2, value: ether(21) });
          let block = await latestBlock();
          let logNewReferral = instance.LogNewReferral({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(logNewReferral);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogNewReferral');
          assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.referrerAddr.toLowerCase(), addr1.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.refBonus.toString(10), mustBe.toString(10));
        });
      });
      it('not active if endTimestamp <= now', async () => {
        await increaseTime(duration.days(5));
        await instance.doInvest(addr1, { from: addr2, value: ether(55) });
        let r = await instance.investorInfo(addr2);
        assert.equal(r[0].toString(10), ether(55).toString(10));
      });
    });
    context('commission', () => {
      it('advertisingAddress', async () => {
        await instance.setAdvertisingAddress(addr2, { from: owner });
        let bb = await getBalance(addr2);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let ba = await getBalance(addr2);
        // eslint-disable-next-line camelcase
        assert.equal(bb.toString(10), ba.minus(p7_5.mul(investment)).toString(10));
      });
      it('adminsAddress', async () => {
        await instance.setAdminsAddress(addr2, { from: owner });
        let bb = await getBalance(addr2);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let ba = await getBalance(addr2);
        assert.equal(bb.toString(10), ba.minus(p5.mul(investment)).toString(10));
      });
    });
    it('sender balance', async () => {
      let bb = await getBalance(addr1);
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
      let txCost = await latestGasUsed();
      txCost *= gasPrice;
      let ba = await getBalance(addr1);
      assert.equal(bb.toString(10), ba.plus(investment).plus(txCost).toString(10));
    });
    it('contract balance', async () => {
      let bb = await getBalance(instance.address);
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
      let ba = await getBalance(instance.address);
      // eslint-disable-next-line camelcase
      let mustBe = new BigNumber(investment.toString(10)).minus(p5.mul(investment).plus(p7_5.mul(investment)));
      assert.equal(bb.toString(10), ba.minus(mustBe).toString(10));
    });
    it('event LogBalanceChanged', async () => {
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
      let block = await latestBlock();
      let logBalanceChanged = instance.LogBalanceChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      // eslint-disable-next-line camelcase
      let mustBe = new BigNumber(investment.toString(10)).minus(p5.mul(investment).plus(p7_5.mul(investment)));
      const logs = await waitEvents(logBalanceChanged);
      assert.equal(logs.length, 1);
      let e = logs[0];

      assert.equal(e.event, 'LogBalanceChanged');
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.balance.toString(10), mustBe.toString(10));
    });
   
    context('newInvestment', () => {
      it('investmentsNumber', async () => {
        let nb = await instance.investmentsNumber();
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let na = await instance.investmentsNumber();
        assert.equal(nb.toString(10), na.minus(1).toString(10));
      });
      it('investorsNumber', async () => {
        let nb = await instance.investorsNumber();
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let na = await instance.investorsNumber();
        assert.equal(nb.toString(10), na.minus(1).toString(10));
      });
      it('dont increase investorsNumber on reinvest', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let nb = await instance.investorsNumber();
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let na = await instance.investorsNumber();
        assert.equal(nb.toString(10), na.toString(10));
      });
      it('investor check info', async () => {
        let infob = await instance.investorInfo(addr1);
        assert.equal(infob[0].toString(10), '0');
        assert.equal(infob[1].toString(10), '0');
        assert.equal(infob[2], false);
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let block = await latestBlock();
        let infoa = await instance.investorInfo(addr1);
        assert.equal(infoa[0].toString(10), investment.toString(10));
        assert.equal(infoa[1].toString(10), '' + block.timestamp);
        assert.equal(infoa[2], false);
      });
      it('event LogNewInvesment', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let block = await latestBlock();
        let LogNewInvesment = instance.LogNewInvesment({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(LogNewInvesment);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogNewInvesment');
        assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
        assert.equal(e.args.investment.toString(10), investment.toString(10));
        assert.equal(e.args.value.toString(10), investment.toString(10));
      });
      it('event LogNewInvestor', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        let block = await latestBlock();
        let logNewInvestor = instance.LogNewInvestor({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logNewInvestor);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogNewInvestor');
        assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      });
      context('reinvest', () => {
        beforeEach(async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        });
        it('check info', async () => {
          let infob = await instance.investorInfo(addr1);
          let block = await latestBlock();
          assert.equal(infob[0].toString(10), investment.toString(10));
          assert.equal(infob[1].toString(10), '' + block.timestamp);
          assert.equal(infob[2], false);
          await increaseTime(duration.minutes(5));

          await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });

          let infoa = await instance.investorInfo(addr1);
          block = await latestBlock();
          let totalInv = new BigNumber(investment.toString(10)).plus(investment);
          assert.equal(infoa[0].toString(10), totalInv.toString(10));
          assert.equal(infoa[1].toString(10), '' + block.timestamp);
          assert.equal(infoa[2], false);
        });
        context('automatic reinvest', () => {
          it('check info', async () => {
            let currp = await instance.dailyPercentAtNow();
            let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
            let d = duration.minutes(125);
            await increaseTime(d);
            await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
            let info = await instance.investorInfo(addr1);
            let block = await latestBlock();
            let mustBe = pp.calcDividends(investment, d).plus(investment).plus(investment);
            assert.equal(info[0].toString(10), mustBe.toString(10));
            assert.equal(info[1].toString(10), '' + block.timestamp);
            assert.equal(info[2], false);
          });
          it('event LogNewInvesment', async () => {
            let d = duration.minutes(125);
            let currp = await instance.dailyPercentAtNow();
            let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
            let mustBe = pp.calcDividends(investment, d).plus(investment);
            await increaseTime(d);
            await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
            let block = await latestBlock();
            let logNewInvesment = instance.LogNewInvesment({}, {
              fromBlock: block.number,
              toBlock: block.number,
            });
            const logs = await waitEvents(logNewInvesment);
            assert.equal(logs.length, 1);
            let e = logs[0];
            assert.equal(e.event, 'LogNewInvesment');
            assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
            assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
            assert.equal(e.args.investment.toString(10), mustBe.toString(10));
            assert.equal(e.args.value.toString(10), investment.toString(10));
          });
          it('event LogAutomaticReinvest', async () => {
            let d = duration.minutes(125);
            await increaseTime(d);
            let mustBe = await instance.investorDividendsAtNow(addr1);
            await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
            let block = await latestBlock();
            let logAutomaticReinvest = instance.LogAutomaticReinvest({}, {
              fromBlock: block.number,
              toBlock: block.number,
            });
            const logs = await waitEvents(logAutomaticReinvest);
            assert.equal(logs.length, 1);
            let e = logs[0];
            assert.equal(e.event, 'LogAutomaticReinvest');
            assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
            assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
            assert.equal(e.args.investment.toString(10), mustBe.toString(10));
          });
        });
      });
      context('ref system', () => {
        beforeEach(async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: investment });
        });
        it('dont get bonus if referrer is sender', async () => {
          await instance.doInvest(addr1, { from: addr1, value: investment });
          let infoa = await instance.investorInfo(addr1);
          assert.equal(infoa[0].toString(10), investment.toString(10));
          assert.equal(infoa[2], false);
        });
        it('dont get bonus if referrer is zero', async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
          let infoa = await instance.investorInfo(addr1);
          assert.equal(infoa[0].toString(10), investment.toString(10));
          assert.equal(infoa[2], false);
        });
        it('dont get bonus if referrer is not investor', async () => {
          await instance.doInvest(addr3, { from: addr1, value: investment });
          let infoa = await instance.investorInfo(addr1);
          assert.equal(infoa[0].toString(10), investment.toString(10));
          assert.equal(infoa[2], false);
        });
        it('dont get bonus if sender already is investor', async () => {
          await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
          let infob = await instance.investorInfo(addr1);
          await instance.doInvest(addr2, { from: addr1, value: investment });
          let infoa = await instance.investorInfo(addr1);
          assert.equal(infoa[0].toString(10), infob[0].plus(investment).toString(10));
          assert.equal(infoa[2], false);
        });

        it('referrer check info', async () => {
          let currp = await instance.refBonusPercentAtNow();
          let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
          let mustBe = pp.mul(investment).plus(investment);
          await instance.doInvest(addr2, { from: addr1, value: investment });
          let infoa = await instance.investorInfo(addr2);
          assert.equal(infoa[0].toString(10), mustBe.toString(10));
          assert.equal(infoa[2], false);
        });
        it('investor check info', async () => {
          let currp = await instance.refBonusPercentAtNow();
          let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
          let mustBe = pp.mul(investment).plus(investment);
          await instance.doInvest(addr2, { from: addr1, value: investment });
          let block = await latestBlock();
          let infoa = await instance.investorInfo(addr1);
          assert.equal(infoa[0].toString(10), mustBe.toString(10));
          assert.equal(infoa[1].toString(10), '' + block.timestamp);
          assert.equal(infoa[2], true);
        });
        it('event LogNewInvesment', async () => {
          let currp = await instance.refBonusPercentAtNow();
          let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
          let mustBe = pp.mul(investment).plus(investment);
          await instance.doInvest(addr2, { from: addr1, value: investment });
          let block = await latestBlock();
          let logNewInvesment = instance.LogNewInvesment({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(logNewInvesment);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogNewInvesment');
          assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.investment.toString(10), mustBe.toString(10));
          assert.equal(e.args.value.toString(10), investment.toString(10));
        });
        it('event LogNewReferral', async () => {
          let currp = await instance.refBonusPercentAtNow();
          let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
          let mustBe = pp.mul(investment);
          await instance.doInvest(addr2, { from: addr1, value: investment });
          let block = await latestBlock();
          let logNewReferral = instance.LogNewReferral({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(logNewReferral);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogNewReferral');
          assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
          assert.equal(e.args.referrerAddr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.refBonus.toString(10), mustBe.toString(10));
        });
      });
    });
  });
  describe('getMyDividends()', () => {
    beforeEach(async () => {
      await initContract(owner);
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
    });
    it('throw if sender not investor', async () => {
      await increaseTime(duration.days(1));
      await assertRevert(instance.getMyDividends({ from: addr2 }));
    });
    it('throw if from contract', async () => {
      await increaseTime(duration.days(1));
      let mockGetMyDividends = await MockGetMyDividends.new({ from: owner });
      await assertRevert(mockGetMyDividends.getMyDividends(instance.address, { from: addr1 }));
    });
    it('throw if latest payment was earlier than 10 min', async () => {
      await increaseTime(duration.minutes(9));
      await assertRevert(instance.getMyDividends({ from: addr1 }));
    });
    it('check info', async () => {
      let infob = await instance.investorInfo(addr1);
      await increaseTime(duration.days(1));
      await instance.getMyDividends({ from: addr1 });
      let block = await latestBlock();
      let infoa = await instance.investorInfo(addr1);
      assert.equal(infoa[0].toString(10), infob[0].toString(10));
      assert.equal(infoa[1].toString(10), '' + block.timestamp);
      assert.equal(infoa[2], false);
    });
    it('contract balance', async () => {
      let bb = await getBalance(instance.address);
      await increaseTime(duration.days(1));
      let div = await instance.investorDividendsAtNow(addr1);
      await instance.getMyDividends({ from: addr1 });
      let ba = await getBalance(instance.address);
      assert.equal(bb.toString(10), ba.plus(div).toString(10));
    });
    it('investor balance', async () => {
      let bb = await getBalance(addr1);
      await increaseTime(duration.days(1));
      let div = await instance.investorDividendsAtNow(addr1);
      await instance.getMyDividends({ from: addr1 });
      let txCost = await latestGasUsed();
      txCost *= gasPrice;
      let ba = await getBalance(addr1);
      assert.equal(bb.toString(10), ba.minus(div).plus(txCost).toString(10));
    });
    it('event LogPayDividends', async () => {
      await increaseTime(duration.days(1));
      let div = await instance.investorDividendsAtNow(addr1);
      await instance.getMyDividends({ from: addr1 });
      let block = await latestBlock();
      let logPayDividends = instance.LogPayDividends({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logPayDividends);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogPayDividends');
      assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.dividends.toString(10), div.toString(10));
    });
    it('event LogBalanceChanged', async () => {
      await increaseTime(duration.days(1));
      let div = await instance.investorDividendsAtNow(addr1);
      let b = await getBalance(instance.address);
      await instance.getMyDividends({ from: addr1 });
      let block = await latestBlock();
      let logBalanceChanged = instance.LogBalanceChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      let mustBe = new BigNumber(b.toString(10)).minus(div);
      const logs = await waitEvents(logBalanceChanged);
      assert.equal(logs.length, 1);
      let e = logs[0];

      assert.equal(e.event, 'LogBalanceChanged');
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.balance.toString(10), mustBe.toString(10));
    });
    
    context('goto next wave', () => {
      beforeEach(async () => {
        await prepareToNextWave(addr1);
      });
      
      it('investmentsNumber = 0', async () => {
        await instance.getMyDividends({ from: addr1 });
        let a = await instance.investmentsNumber({ from: addr1 });
        assert.equal(a.toString(10), '0');
      });
      it('investorsNumber = 0', async () => {
        await instance.getMyDividends({ from: addr1 });
        let a = await instance.investorsNumber({ from: addr1 });
        assert.equal(a.toString(10), '0');
      });
      it('save referrals', async () => {
        investment = await instance.minInvesment();
        await instance.doInvest(addr1, { from: addr2, value: investment });
        let r = await instance.investorInfo(addr2);
        assert.equal(r[2], true);
        await prepareToNextWave(addr2);
        await instance.getMyDividends({ from: addr1 });

        r = await instance.investorsNumber({ from: addr1 });
        assert.equal(r.toString(10), '0');
        r = await instance.investorInfo(addr2);
        assert.equal(r[2], true);

        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: investment });
        await instance.doInvest(addr1, { from: addr2, value: investment });

        r = await instance.investorInfo(addr2);
        assert.equal(r[0].toString(10), investment.toString(10));
      });
      it('waveStartup', async () => {
        await instance.getMyDividends({ from: addr1 });
        let a = await instance.waveStartup({ from: addr1 });
        let ltime = await latestTime();
        assert.equal(a.toString(), ltime.toString(10));
      });
      it('emit LogNextWave', async () => {
        await instance.getMyDividends({ from: addr1 });
        let block = await latestBlock();
        let logNextWave = instance.LogNextWave({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logNextWave);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogNextWave');
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      });
      it('TODO RGP', async () => {
      });
      it('contract balance', async () => {
        await instance.getMyDividends({ from: addr1 });
        let b = await getBalance(instance.address);
        assert.equal(b.toString(10), '0');
      });
      it('event LogPayDividends', async () => {
        let b = await getBalance(instance.address);
        await instance.getMyDividends({ from: addr1 });
        let block = await latestBlock();
        let logPayDividends = instance.LogPayDividends({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logPayDividends);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogPayDividends');
        assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
        assert.equal(e.args.dividends.toString(10), b.toString(10));
      });
    });
  });
    
  describe('fallback', () => {
    beforeEach(async () => {
      await initContract(owner);
    });
    context('do invest if msg.value > 0', () => {
      it('success do inveset', async () => {
        let addGas = process.env.SOLIDITY_COVERAGE ? 100000 : 0;
        let infoB = await instance.investorInfo(addr1);
        assert.equal(infoB[0].toString(10), '0');
        await sendTransaction({
          from: addr1,
          to: instance.address,
          value: investment,
          gas: 200000 + addGas,
          gasPrice: gasPrice,
        });
        let infoA = await instance.investorInfo(addr1);
        assert.equal(infoA[0].toString(10), investment.toString(10));
      });
      it('check msg.data to address', async () => {
        let addGas = process.env.SOLIDITY_COVERAGE ? 100000 : 0;
        await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: investment });
        
        let infoB = await instance.investorInfo(addr1);
        assert.equal(infoB[2], false);

        let currp = await instance.refBonusPercentAtNow();
        let pp = new Percent(currp[0].toNumber(), currp[1].toNumber());
        let mustBe = pp.mul(investment).plus(investment);

        await sendTransaction({
          from: addr1,
          to: instance.address,
          value: investment,
          gas: 200000 + addGas,
          data: addr2.toLowerCase(),
        });

        let infoA = await instance.investorInfo(addr1);
        assert.equal(infoA[0].toString(10), mustBe.toString(10));
        assert.equal(infoA[2], true);
      });
    });
    it('getMyDividends if msg.value = 0', async () => {
      let addGas = process.env.SOLIDITY_COVERAGE ? 100000 : 0;
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: ether(1) });
      await increaseTime(duration.hours(24) + duration.seconds(100));

      let div = await instance.investorDividendsAtNow(addr1);
      let bb = await getBalance(addr1);
      await sendTransaction({
        from: addr1,
        to: instance.address,
        value: 0,
        gas: 200000 + addGas,
        gasPrice: gasPrice,
      });
        
      let cost = await latestGasUsed() * gasPrice;
      let ba = await getBalance(addr1);
      assert.equal(bb.toString(10), ba.minus(div).plus(cost).toString(10));
    });
  });
});
