import latestBlock from './helpers/latestBlock';
import ether from './helpers/ether';
import increaseTime, { duration } from './helpers/increaseTime';

const PrivateEntrance = artifacts.require('./contracts/test/TestPrivateEntrance.sol');
const MockRev1Storage = artifacts.require('./contracts/mocks/MockRev1Storage.sol');
const MockRev2Storage = artifacts.require('./contracts/mocks/MockRev2Storage.sol');

let instance, mockRev1Storage, mockRev2Storage;

contract('PrivateEntrance', function ([_, owner, addr1, addr2, addrNoAccess]) {
  before(async function () {
    instance = await PrivateEntrance.new({ from: owner });
    mockRev1Storage = await MockRev1Storage.new({ from: owner });
    mockRev2Storage = await MockRev2Storage.new({ from: owner });
    await instance.setRev1Storage(mockRev1Storage.address, { from: owner });
    await instance.setRev2Storage(mockRev2Storage.address, { from: owner });
  });
  describe('isActive', () => {
    it('false if now >= endTimestamp', async () => {
      let b = await latestBlock();
      await instance.setEndTimestamp(b.timestamp);
      await increaseTime(duration.minutes(1));

      let r = await instance.testIsActive();
      assert.equal(r, false);
    });
    it('true if endTimestamp > now ', async () => {
      let b = await latestBlock();
      await instance.setEndTimestamp(b.timestamp + 100);
      let r = await instance.testIsActive();
      assert.equal(r, true);
    });
  });
  describe('provideAccessFor', () => {
    it('addr1, addr2 dont has access', async () => {
      let r = await instance.hasAccess(addr1);
      assert.equal(r, false);
      r = await instance.hasAccess(addr2);
      assert.equal(r, false);
    });
    it('provideAccessFor[addr1, addr2] = has access', async () => {
      await instance.testProvideAccessFor([addr1, addr2]);
      let r = await instance.hasAccess(addr1);
      assert.equal(r, true);
      r = await instance.hasAccess(addr2);
      assert.equal(r, true);
    });
  });
  describe('maxInvestmentFor', () => {
    it('0 if dont has access', async () => {
      let r = await instance.testMaxInvestmentFor(addrNoAccess);
      assert.equal(r.toString(10), '0');
    });
    it('0 if revolution1 investment is 0', async () => {
      await mockRev1Storage.setInvestor(addr1, 0, 1);
      let r = await instance.testMaxInvestmentFor(addr1);
      assert.equal(r.toString(10), '0');
    });
    it('0 if current investment of revolution2 >= maxInvestment', async () => {
      await mockRev1Storage.setInvestor(addr1, ether(2), 1);
      await mockRev2Storage.setInvestor(addr1, ether(1), 0);
      await instance.setInvestorMaxInvestment(ether(1));
      let r = await instance.testMaxInvestmentFor(addr1);
      assert.equal(r.toString(10), '0');
    });
    it('investorMaxInvestment if current investment of revolution1 >= investorMaxInvestment', async () => {
      await mockRev1Storage.setInvestor(addr1, ether(2), 1);
      await mockRev2Storage.setInvestor(addr1, 0, 0);
      await instance.setInvestorMaxInvestment(ether(1));
      let r = await instance.testMaxInvestmentFor(addr1);
      assert.equal(r.toString(10), ether(1).toString(10));
    });
    it('maxInvestment-currInvestment ', async () => {
      await mockRev1Storage.setInvestor(addr1, ether(2), 0);
      await mockRev2Storage.setInvestor(addr1, ether(0.5), 0);
      await instance.setInvestorMaxInvestment(ether(1));
      let r = await instance.testMaxInvestmentFor(addr1);
      assert.equal(r.toString(10), ether(0.5).toString(10));
    });
  });
});
