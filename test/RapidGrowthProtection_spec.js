import latestBlock from './helpers/latestBlock';
import increaseTime, { duration } from './helpers/increaseTime';
import ether from './helpers/ether';

const RapidGrowthProtection = artifacts.require('./contracts/test/TestRapidGrowthProtection.sol');

let instance;
let oneEther = ether(1);

contract('RapidGrowthProtection', function ([_, owner]) {
  before(async function () {
    instance = await RapidGrowthProtection.new({ from: owner });
  });
  describe('currDay', () => {
    it('1 on firs day', async () => {
      let b = await latestBlock();
      await instance.setStartTimestamp(b.timestamp);
      await increaseTime(duration.minutes(1));
      let r = await instance.testCurrDay();
      assert.equal(r.toString(10), '1');
    });
    it('5 after 4 days', async () => {
      let b = await latestBlock();
      await instance.setStartTimestamp(b.timestamp);
      await increaseTime(duration.days(4) + duration.minutes(1));
      let r = await instance.testCurrDay();
      assert.equal(r.toString(10), '5');
    });
  });
  describe('isActive', () => {
    it('false if currDay > activityDays', async () => {
      let b = await latestBlock();
      await instance.setStartTimestamp(b.timestamp);
      await increaseTime(duration.days(4) + duration.minutes(1));
      let r = await instance.testCurrDay();
      assert.equal(r.toString(10), '5');
      await instance.setActivityDays(3);
      r = await instance.rpg();
      assert.equal(r[2].toString(10), '3');
      r = await instance.testIsActive();
      assert.equal(r, false);
    });
    it('true if rgp.currDay <= activityDays', async () => {
      let b = await latestBlock();
      await instance.setStartTimestamp(b.timestamp);
      await increaseTime(duration.days(4) + duration.minutes(1));
      let r = await instance.testCurrDay();
      assert.equal(r.toString(10), '5');
      await instance.setActivityDays(5);
      r = await instance.testIsActive();
      assert.equal(r, true);
    });
  });
  describe('saveInvestment', () => {
    before(async function () {
      // save oneEther on 5 days
      await instance.setDailyTotalInvestment(5, oneEther);
      let r = await instance.dailyTotalInvestment(5);
      assert.equal(oneEther.toString(10), r.toString(10));

      // set curr day is 5
      let b = await latestBlock();
      await instance.setStartTimestamp(b.timestamp);
      await increaseTime(duration.days(4) + duration.minutes(1));
      r = await instance.testCurrDay();
      assert.equal(r.toString(10), '5');
    });
    it('dont save if currDay > activityDays - return false', async () => {
      // set activity days is 3
      await instance.setActivityDays(3);

      // dont change Investment - return false
      await instance.testSaveInvestment(oneEther);
      let r = await instance.dailyTotalInvestment(5);
      assert.equal(oneEther.toString(10), r.toString(10));
      r = await instance.testSaveInvestmentRes();
      assert.equal(r, false);
    });

    it('dont save curr dailyTotalInvestment + investment >= maxDailyTotalInvestment', async () => {
      // set activity days is 3
      await instance.setActivityDays(7);

      // set setMaxDailyTotalInvestment to 1.5 ether
      await instance.setMaxDailyTotalInvestment(ether(1.5));

      // dont change Investment - return false
      await instance.testSaveInvestment(oneEther);
      let r = await instance.dailyTotalInvestment(5);
      assert.equal(oneEther.toString(10), r.toString(10));
      r = await instance.testSaveInvestmentRes();
      assert.equal(r, false);
    });
    it('success', async () => {
      // set activity days is 7
      await instance.setActivityDays(7);

      // set setMaxDailyTotalInvestment to 2 ether
      await instance.setMaxDailyTotalInvestment(ether(2));

      // success change
      await instance.testSaveInvestment(oneEther);
      let r = await instance.dailyTotalInvestment(5);
      assert.equal(ether(2).toString(10), r.toString(10));
      r = await instance.testSaveInvestmentRes();
      assert.equal(r, true);
    });
  });
  describe('startAt', () => {
    it('check chenging startTimestamp', async () => {
      await instance.setStartTimestamp(1);
      let r = await instance.rpg();
      assert.equal(r[0].toString(10), '1');

      await instance.testStartAt(2);
      r = await instance.rpg();
      assert.equal(r[0].toString(10), '2');
    });
    it('check if restart was be', async () => {
      await instance.setActivityDays(21);
      await instance.setDailyTotalInvestment(10, 10);
      await instance.testStartAt(2);
      let r = await instance.dailyTotalInvestment(10);
      assert.equal(r.toString(10), '0');
    });
  });
  describe('maxInvestmentAtNow', () => {
    before(async function () {
      // set curr day is 5
      let b = await latestBlock();
      await instance.setStartTimestamp(b.timestamp);
      await increaseTime(duration.days(4) + duration.minutes(1));
    });
    it('0 if currDay > activityDays', async () => {
      await instance.setActivityDays(3);
      let r = await instance.testMaxInvestmentAtNow();
      assert.equal(r.toString(10), '0');
    });
    it('0 if dailyTotalInvestment >= maxDailyTotalInvestment', async () => {
      await instance.setActivityDays(7);
      await instance.setDailyTotalInvestment(5, ether(2));
      await instance.setMaxDailyTotalInvestment(oneEther);
      let r = await instance.testMaxInvestmentAtNow();
      assert.equal(r.toString(10), '0');
    });
    it('maxDailyTotalInvestment - dailyTotalInvestment', async () => {
      await instance.setActivityDays(7);
      await instance.setDailyTotalInvestment(5, oneEther);
      await instance.setMaxDailyTotalInvestment(ether(2));
      let r = await instance.testMaxInvestmentAtNow();
      assert.equal(r.toString(10), oneEther.toString(10));
    });
  });
});
