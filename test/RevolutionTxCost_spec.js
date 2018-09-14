import getAccounts from './helpers/getAccounts';
import ether from './helpers/ether';
import latestGasUsed from './helpers/latestGasUsed';
import { gasPrice } from './helpers/gasPrice';
const Revolution = artifacts.require('./contracts/Revolution.sol');

let accs, instance, owner, addr1, addr2, addr3, addr4, addr5, addr6, value;

let initContract = async function () {
  instance = await Revolution.new({ from: owner });
};
contract('Revolution Tx Cost', () => {
  before(async function () {
    accs = await getAccounts();
    owner = accs[0];
    addr1 = accs[1];
    addr2 = accs[2];
    addr3 = accs[3];
    addr4 = accs[4];
    addr5 = accs[5];
    addr6 = accs[6];
  });

  describe('doInvest', () => {
    before(async () => {
      await initContract();
      value = ether(1);
    });

    context('first entrace', () => {
      it('first', async () => {
        await instance.doInvest([], { from: addr1, value: value });
        let cost = latestGasUsed();
        console.log('[] ' + cost);
      });
      it('[]', async () => {
        await instance.doInvest([], { from: addr2, value: value });
        let cost = latestGasUsed();
        console.log('[] ' + cost);
      });
      it('[addr] - not referrer', async () => {
        await instance.doInvest([addr4], { from: addr3, value: value });
        let cost = latestGasUsed();
        console.log('[addr] ' + cost);
      });
      it('[addr] - referrer', async () => {
        await instance.doInvest([addr1], { from: addr4, value: value });
        let cost = latestGasUsed();
        console.log('[addr] ' + cost);
      });
      it('fallback without referrel', async () => {
        await web3.eth.sendTransaction({
          from: addr5,
          to: instance.address,
          value: value,
          gas: 300000,
          gasPrice: gasPrice,
        });
        let cost = latestGasUsed();
        console.log('[] ' + cost);
      });
      it('fallback with referrel', async () => {
        await web3.eth.sendTransaction({
          from: addr6,
          to: instance.address,
          value: value,
          gas: 300000,
          gasPrice: gasPrice,
          data: addr2.toLowerCase(),
        });
        let cost = latestGasUsed();
        console.log('[] ' + cost);
        let infoA = await instance.investorInfo(addr2);
        assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
      });
    });
    context('second', () => {
      it('[]', async () => {
        await instance.doInvest([], { from: addr2, value: value });
        let cost = latestGasUsed();
        console.log('[] ' + cost);
      });
      it('[addr] - not referrer', async () => {
        await instance.doInvest([addr4], { from: addr3, value: value });
        let cost = latestGasUsed();
        console.log('[addr] ' + cost);
      });
      it('[addr] - referrer', async () => {
        await instance.doInvest([addr1], { from: addr4, value: value });
        let cost = latestGasUsed();
        console.log('[addr] ' + cost);
      });
      it('fallback without referrel', async () => {
        await web3.eth.sendTransaction({
          from: addr5,
          to: instance.address,
          value: value,
          gas: 300000,
          gasPrice: gasPrice,
        });
        let cost = latestGasUsed();
        console.log('[] ' + cost);
      });
      it('fallback with referrel', async () => {
        await web3.eth.sendTransaction({
          from: addr5,
          to: instance.address,
          value: value,
          gas: 300000,
          gasPrice: gasPrice,
          data: addr3.toLowerCase(),
        });
        let cost = latestGasUsed();
        let infoA = await instance.investorInfo(addr3);
        assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
        console.log('[] ' + cost);
      });
    });
  });
  describe('payout', () => {
    beforeEach(async () => {
      await initContract();
      value = ether(1);
    });
    context('without referrers', () => {
      it('6', async () => {
        await instance.doInvest([], { from: addr1, value: value });
        await instance.doInvest([], { from: addr2, value: value });
        await instance.doInvest([], { from: addr3, value: value });
        await instance.doInvest([], { from: addr4, value: value });
        await instance.doInvest([], { from: addr5, value: value });
        await instance.doInvest([], { from: addr6, value: value });
        await instance.payout({ from: owner });
        let cost = latestGasUsed();
        console.log(cost);
      });
      it('5', async () => {
        await instance.doInvest([], { from: addr1, value: value });
        await instance.doInvest([], { from: addr2, value: value });
        await instance.doInvest([], { from: addr3, value: value });
        await instance.doInvest([], { from: addr4, value: value });
        await instance.doInvest([], { from: addr5, value: value });
        await instance.payout({ from: owner });
        let cost = latestGasUsed();
        console.log(cost);
      });
      it('4', async () => {
        await instance.doInvest([], { from: addr1, value: value });
        await instance.doInvest([], { from: addr2, value: value });
        await instance.doInvest([], { from: addr3, value: value });
        await instance.doInvest([], { from: addr4, value: value });
        await instance.payout({ from: owner });
        let cost = latestGasUsed();
        console.log(cost);
      });
    });
    context('with referrers', () => {
      it('6', async () => {
        await instance.doInvest([], { from: addr1, value: value });
        await instance.doInvest([addr1], { from: addr2, value: value });
        await instance.doInvest([addr2], { from: addr3, value: value });
        await instance.doInvest([addr3], { from: addr4, value: value });
        await instance.doInvest([addr4], { from: addr5, value: value });
        await instance.doInvest([addr5], { from: addr6, value: value });
        await instance.payout({ from: owner });
        let cost = latestGasUsed();
        console.log(cost);
      });
      it('5', async () => {
        await instance.doInvest([], { from: addr1, value: value });
        await instance.doInvest([addr1], { from: addr2, value: value });
        await instance.doInvest([addr2], { from: addr3, value: value });
        await instance.doInvest([addr3], { from: addr4, value: value });
        await instance.doInvest([addr4], { from: addr5, value: value });
        await instance.payout({ from: owner });
        let cost = latestGasUsed();
        console.log(cost);
      });
      it('4', async () => {
        await instance.doInvest([], { from: addr1, value: value });
        await instance.doInvest([addr1], { from: addr2, value: value });
        await instance.doInvest([addr2], { from: addr3, value: value });
        await instance.doInvest([addr3], { from: addr4, value: value });
        await instance.payout({ from: owner });
        let cost = latestGasUsed();
        console.log(cost);
      });
    });
  });
});
