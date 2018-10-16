import ether from './helpers/ether';
import latestGasUsed from './helpers/latestGasUsed';
import latestTime from './helpers/latestTime';
import increaseTime, { duration } from './helpers/increaseTime';
import { ZERO_ADDRESS } from './helpers/zeroAddress';
const Revolution = artifacts.require('./contracts/Revolution2.sol');
const MockRev1Storage = artifacts.require('./contracts/mocks/MockRev1Storage.sol');

let instance, value;

let initContract = async function (owner) {
  instance = await Revolution.new({ from: owner });
};
contract('Revolution Tx Cost', function ([_, owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7]) {
  describe('doInvest', () => {
    context('first entrance', () => {
      beforeEach(async () => {
        await initContract(owner);
        value = ether(1);
      });
      it('first', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        let cost = await latestGasUsed();
        console.log('first: ' + cost);
      });

      it('not init', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });

        await instance.doInvest(ZERO_ADDRESS, { from: addr2, value: value });
        let cost = await latestGasUsed();
        console.log('not init: ' + cost);
      });

      it('on private entrace', async () => {
        let mockRev1Storage = await MockRev1Storage.new({ from: owner });
        let b = await latestTime();
        await instance.init(mockRev1Storage.address, b + duration.days(1), { from: owner });
        await instance.privateEntranceProvideAccessFor([addr1, addr3], { from: owner });
        await mockRev1Storage.setInvestor(addr1, ether(100), 0);
        await mockRev1Storage.setInvestor(addr3, ether(100), 0);
        await increaseTime(duration.minutes(10));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });

        await instance.doInvest(ZERO_ADDRESS, { from: addr3, value: value });
        let cost = await latestGasUsed();
        console.log('on private entrace: ' + cost);
      });

      it('on rpg', async () => {
        let b = await latestTime();
        await instance.init(addr2, b, { from: owner });
        await increaseTime(duration.minutes(10));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });

        await instance.doInvest(ZERO_ADDRESS, { from: addr4, value: value });
        let cost = await latestGasUsed();
        console.log('on rpg: ' + cost);
      });

      it('after rpg', async () => {
        let b = await latestTime();
        await instance.init(addr2, b, { from: owner });
        await increaseTime(duration.days(22));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });

        await instance.doInvest(ZERO_ADDRESS, { from: addr5, value: value });
        let cost = await latestGasUsed();
        console.log('after rpg: ' + cost);
      });

      it('after rpg with referral', async () => {
        let b = await latestTime();
        await instance.init(addr2, b, { from: owner });
        await increaseTime(duration.days(22));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });

        await instance.doInvest(addr1, { from: addr5, value: value });
        let cost = await latestGasUsed();
        console.log('after rpg with referral: ' + cost);
      });
    });

    context('reinvest with getting dividends after 1 day', () => {
      it('not init', async () => {
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });

        await increaseTime(duration.days(1));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        let cost = await latestGasUsed();
        console.log('not init: ' + cost);
      });

      it('on private entrace', async () => {
        let mockRev1Storage = await MockRev1Storage.new({ from: owner });
        let b = await latestTime();
        await instance.init(mockRev1Storage.address, b + duration.days(1), { from: owner });
        await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
        await mockRev1Storage.setInvestor(addr1, ether(100), 0);
        await increaseTime(duration.minutes(10));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        await increaseTime(duration.days(1));

        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        let cost = await latestGasUsed();
        console.log('on private entrace: ' + cost);
      });

      it('on rpg', async () => {
        let b = await latestTime();
        await instance.init(addr2, b, { from: owner });
        await increaseTime(duration.minutes(10));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        await increaseTime(duration.days(1));

        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        let cost = await latestGasUsed();
        console.log('on rpg: ' + cost);
      });

      it('after rpg', async () => {
        let b = await latestTime();
        await instance.init(addr2, b, { from: owner });
        await increaseTime(duration.days(22));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        await increaseTime(duration.days(1));

        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        let cost = await latestGasUsed();
        console.log('after rpg: ' + cost);
      });

      it('after rpg with referral', async () => {
        let b = await latestTime();
        await instance.init(addr2, b, { from: owner });
        await increaseTime(duration.days(22));
        await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
        await increaseTime(duration.days(1));

        await instance.doInvest(addr1, { from: addr1, value: value });
        let cost = await latestGasUsed();
        console.log('after rpg with referral: ' + cost);
      });
    });
  });

  describe('getMyDividends after 1 day', () => {
    before(async () => {
      await initContract(owner);
      value = ether(1);
    });
    it('not init', async () => {
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });

      await increaseTime(duration.days(1));
      await instance.getMyDividends({ from: addr1 });
      let cost = await latestGasUsed();
      console.log('not init: ' + cost);
    });

    it('on private entrace', async () => {
      let mockRev1Storage = await MockRev1Storage.new({ from: owner });
      let b = await latestTime();
      await instance.init(mockRev1Storage.address, b + duration.days(1), { from: owner });
      await instance.privateEntranceProvideAccessFor([addr1], { from: owner });
      await mockRev1Storage.setInvestor(addr1, ether(100), 0);
      await increaseTime(duration.minutes(10));
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
      await increaseTime(duration.days(1));

      await instance.getMyDividends({ from: addr1 });
      let cost = await latestGasUsed();
      console.log('on private entrace: ' + cost);
    });

    it('on rpg', async () => {
      let b = await latestTime();
      await instance.init(addr2, b, { from: owner });
      await increaseTime(duration.minutes(10));
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
      await increaseTime(duration.days(1));

      await instance.getMyDividends({ from: addr1 }); let cost = await latestGasUsed();
      console.log('on rpg: ' + cost);
    });

    it('after rpg', async () => {
      let b = await latestTime();
      await instance.init(addr2, b, { from: owner });
      await increaseTime(duration.days(22));
      await instance.doInvest(ZERO_ADDRESS, { from: addr1, value: value });
      await increaseTime(duration.days(1));

      await instance.getMyDividends({ from: addr1 }); let cost = await latestGasUsed();
      console.log('after rpg: ' + cost);
    });
  });
});
