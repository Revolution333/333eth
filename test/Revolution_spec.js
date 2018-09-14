import getAccounts from './helpers/getAccounts';
import increaseTime, { duration } from './helpers/increaseTime';
import checkPublicABI from './helpers/checkPublicABI';
import ether from './helpers/ether';
import latestGasUsed from './helpers/latestGasUsed';
import latestTime from './helpers/latestTime';
import latestBlock from './helpers/latestBlock';
import assertRevert from './helpers/assertRevert';
import { ZERO_ADDRESS } from './helpers/zeroAddress';
import { gasPrice } from './helpers/gasPrice';
import getBalance from './helpers/getBalance';
import waitEvents from './helpers/waitEvents';
import { Paymode } from './PaymentSystem_spec';
import { AccessRank } from './Accessibility_spec';
const Revolution = artifacts.require('./contracts/Revolution.sol');

let instance, owner, addr1, addr2, addr3, addr4, creationTime;

let initContract = async function () {
  instance = await Revolution.new({ from: owner });
  creationTime = latestTime();
};
  
let nextWavePush = async function () {
  await instance.doInvest([0], { from: addr2, value: ether(1) });
  for (let i = 0; i < 26; i++) {
    await increaseTime(duration.hours(13));
    await instance.payout({ from: owner });
  }
};

let nextWavePull = async function () {
  await instance.doInvest([0], { from: addr2, value: ether(1) });
  await instance.payout({ from: owner });
  await instance.setPullPaymode({ from: owner });
  for (let i = 0; i < 24; i++) {
    await increaseTime(duration.hours(25));
    await instance.getMyDividends({ from: addr2 });
  }
};

contract('Revolution', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    addr1 = accs[1];
    addr2 = accs[2];
    addr3 = accs[3];
    addr4 = accs[4];
  });
    
  describe('check initialization', () => {
    before(async () => {
      await initContract();
    });
    it('has a limited public ABI', () => {
      let expectedABI = [
        'adminAddr',
        'payerAddr',
        'investmentsNum',
        'minInvesment',
        'investorsNumber',
        'balanceETH',
        'payerPercent',
        'dividendsPercent',
        'adminPercent',
        'investorInfo',
        'getMyDividends',
        'doInvest',
        'payout',
        'setPullPaymode',
        'setAdminAddr',
        'setPayerAddr',
        'provideAccess',
        'access',
        'paymode',
        'maxBalance',
        'pauseOnNextWave',
        'waveStartup',
        'referrerPercent',
        'latestPayout',
      ];
      checkPublicABI(Revolution, expectedABI);
    });
    it('adminAddr', async () => {
      let a = await instance.adminAddr({ from: addr1 });
      assert.equal(a.toLowerCase(), owner.toLowerCase());
    });
    it('payerAddr', async () => {
      let a = await instance.payerAddr({ from: addr1 });
      assert.equal(a.toLowerCase(), owner.toLowerCase());
    });
    it('minInvesment', async () => {
      let a = await instance.minInvesment({ from: addr1 });
      assert.equal(a.toString(10), ether(0.01).toString(10));
    });
    it('maxBalance', async () => {
      let a = await instance.maxBalance({ from: addr1 });
      assert.equal(a.toString(10), ether(33300000).toString(10));
    });
    it('pauseOnNextWave', async () => {
      let a = await instance.pauseOnNextWave({ from: addr1 });
      assert.equal(a.toNumber(), 168 * 60 * 60);
    });
    it('payerPercent', async () => {
      let a = await instance.payerPercent({ from: addr1 });
      // 7 / 100 * 100% = 7%
      assert.equal(a[0].toNumber(), 7);
      assert.equal(a[1].toNumber(), 100);
    });
    it('dividendsPercent', async () => {
      let a = await instance.dividendsPercent({ from: addr1 });
      // 333 / 10000 * 100% = 3.33%
      assert.equal(a[0].toNumber(), 333);
      assert.equal(a[1].toNumber(), 10000);
    });
    it('adminPercent', async () => {
      let a = await instance.adminPercent({ from: addr1 });
      // 1 / 10 * 100% = 10%
      assert.equal(a[0].toNumber(), 1);
      assert.equal(a[1].toNumber(), 10);
    });
    it('paymode', async () => {
      let a = await instance.paymode({ from: addr1 });
      assert.equal(a.toNumber(), Paymode.Push);
    });
    it('waveStartup', async () => {
      let a = await instance.waveStartup({ from: addr1 });
      let b = await instance.pauseOnNextWave({ from: addr1 });
      assert.equal(a.toNumber(), creationTime - b.toNumber());
    });
    it('access', async () => {
      let a = await instance.access(owner, { from: addr1 });
      assert.equal(a.toNumber(), AccessRank.Full);
    });
    it('referrerPercent', async () => {
      let a = await instance.referrerPercent({ from: addr1 });
      // 3 / 100 * 100% = 3%
      assert.equal(a[0].toNumber(), 3);
      assert.equal(a[1].toNumber(), 100);
    });

    it('balanceETH', async () => {
      let a = await instance.balanceETH({ from: addr1 });
      assert.equal(a.toString(10), '0');
    });
  });

  describe('change state', () => {
    before(async () => {
      await initContract();
    });
    context('setAdminAddr', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.setAdminAddr(addr1, { from: addr1 }));
        let a = await instance.adminAddr({ from: addr2 });
        assert.equal(a.toLowerCase(), owner.toLowerCase());
      });
      it('change state', async () => {
        await instance.setAdminAddr(addr1, { from: owner });
        let a = await instance.adminAddr({ from: addr2 });
        assert.equal(a.toLowerCase(), addr1.toLowerCase());
      });
      it('event LogAdminAddrChanged', async () => {
        let block = latestBlock();
        let logAdminAddrChanged = instance.LogAdminAddrChanged({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logAdminAddrChanged);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogAdminAddrChanged');
        assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      });
    });
    context('setPayerAddr', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.setPayerAddr(addr1, { from: addr1 }));
        let a = await instance.payerAddr({ from: addr2 });
        assert.equal(a.toLowerCase(), owner.toLowerCase());
      });
      it('change state', async () => {
        await instance.setPayerAddr(addr2, { from: owner });
        let a = await instance.payerAddr({ from: addr1 });
        assert.equal(a.toLowerCase(), addr2.toLowerCase());
      });
      it('event LogPayerAddrChanged', async () => {
        let block = latestBlock();
        let logPayerAddrChanged = instance.LogPayerAddrChanged({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
        const logs = await waitEvents(logPayerAddrChanged);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogPayerAddrChanged');
        assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      });
    });
        
    context('provideAccess', () => {
      it('throw on access denied', async () => {
        await assertRevert(instance.provideAccess(addr1, AccessRank.Paymode, { from: addr1 }));
        let a1 = await instance.access(addr1, { from: addr2 });
        assert.equal(a1.toNumber(), AccessRank.None);
      });

      it('change state', async () => {
        await instance.provideAccess(addr1, AccessRank.Paymode, { from: owner });
        await instance.provideAccess(addr2, AccessRank.Full, { from: owner });
        let a1 = await instance.access(addr1, { from: addr2 });
        let a2 = await instance.access(addr2, { from: addr1 });
        assert.equal(a1.toNumber(), AccessRank.Paymode);
        assert.equal(a2.toNumber(), AccessRank.Full);
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
    });

    context('setPullPaymode', () => {
      beforeEach(async () => {
        await initContract();
        await instance.doInvest([], { from: addr1, value: ether(1) });
      });
      it('throw on access denied', async () => {
        await instance.payout({ from: owner });
        await assertRevert(instance.setPullPaymode({ from: addr1 }));
        let after = await instance.paymode({ from: addr2 });
        assert.equal(after.toNumber(), Paymode.Push);
      });
      it('cannot set pull pay mode if latest time is 0', async () => {
        await assertRevert(instance.setPullPaymode({ from: owner }));
      });
            
      it('change state', async () => {
        await instance.payout({ from: owner });
        await instance.setPullPaymode({ from: owner });
        let a = await instance.paymode({ from: owner });
        assert.equal(a.toNumber(), Paymode.Pull);
      });
      it('event LogPaymodeChanged', async () => {
        await instance.payout({ from: owner });
        await instance.setPullPaymode({ from: owner });
        let block = latestBlock();
        let logPaymodeChanged = instance.LogPaymodeChanged({}, {
          fromBlock: block.number,
          toBlock: block.number,
        });
                
        const logs = await waitEvents(logPaymodeChanged);
        assert.equal(logs.length, 1);
        let e = logs[0];
        assert.equal(e.event, 'LogPaymodeChanged');
        assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
        assert.equal(e.args.mode.toNumber(), Paymode.Pull);
      });
    });
  });
    
  describe('notOnPause', () => {
    beforeEach(async () => {
      await initContract();
    });
    it('throw getMyDividends', async () => {
      await nextWavePush();
      await assertRevert(instance.getMyDividends({ from: addr1 }));
    });
    it('throw doInvest', async () => {
      await nextWavePush();
      await assertRevert(instance.doInvest([], { from: addr1, value: ether(1) }));
    });
    it('throw payout', async () => {
      await nextWavePush();
      await assertRevert(instance.payout({ from: owner }));
    });
    it('auto pay mode - push', async () => {
      await nextWavePull();
      let a = await instance.paymode({ from: addr1 });
      assert.equal(a.toNumber(), Paymode.Push);
    });
    it('investmentsNum = 0', async () => {
      await nextWavePush();
      let a = await instance.investmentsNum({ from: addr1 });
      assert.equal(a.toString(10), '0');
    });
    it('investorsNumber = 0', async () => {
      await nextWavePush();
      let a = await instance.investorsNumber({ from: addr1 });
      assert.equal(a.toString(10), '0');
    });
    it('save referrals', async () => {
      await instance.doInvest([], { from: addr1, value: ether(1) });
      await instance.doInvest([addr1], { from: addr2, value: ether(1) });
      let ib = await instance.investorInfo(addr2);
      assert.equal(ib[3], true);
      await nextWavePush();
      let ia = await instance.investorInfo(addr2);
      assert.equal(ia[3], true);
    });
    it('waveStartup', async () => {
      await nextWavePush();
      let a = await instance.waveStartup({ from: addr1 });
      assert.equal(a.toNumber(), latestTime().toString(10));
    });
    it('emit LogNextWave', async () => {
      await nextWavePush();
      let block = latestBlock();
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
  });

  describe('doInvest(address[3] refs)', () => {
    beforeEach(async () => {
      await initContract();
    });
    it('throw on low msg.value', async () => {
      let minValue = await instance.minInvesment();
      await assertRevert(instance.doInvest([0, 0, 0], { from: addr1, value: minValue.minus(100) }));
    });
    it('success with valid msg.value', async () => {
      let minValue = await instance.minInvesment();
      await instance.doInvest([0, 0, 0], { from: addr1, value: minValue });
    });
    context('ref system', () => {
      context('1 level', () => {
        it('check bonus 3% for referrer1', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          let infoB = await instance.investorInfo(addr1);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(addr1);
          assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
        });
        it('check bonus 3.33% for referral', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          let info = await instance.investorInfo(addr2);
          assert.equal(info[0].toString(10), ether(1.0333).toString(10));
        });
        it('dont get bonus if referrer1 is sender', async () => {
          let infoB = await instance.investorInfo(addr2);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr2], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(addr2);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('dont get bonus if referrer1 is zero', async () => {
          let infoB = await instance.investorInfo(addr2);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([ZERO_ADDRESS], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(ZERO_ADDRESS);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('dont get bonus if referrer1 is not investor', async () => {
          let infoB = await instance.investorInfo(addr1);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(addr1);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('dont get bonus if sender already is referrer', async () => {
          await instance.doInvest([], { from: addr2, value: ether(1) });
          await instance.doInvest([addr2], { from: addr1, value: ether(1) });
          let infoB = await instance.investorInfo(addr2);
          assert.equal(infoB[2].toString(10), ether(0.03).toString(10));
          await instance.doInvest([addr2], { from: addr1, value: ether(1) });
          let infoA = await instance.investorInfo(addr2);
          assert.equal(infoA[2].toString(10), infoB[2].toString(10));
        });
        it('new referrer check info', async () => {
          let infoB = await instance.investorInfo(addr1);
          assert.equal(infoB[3], false);
          await instance.doInvest([], { from: addr2, value: ether(1) });
          await instance.doInvest([addr2], { from: addr1, value: ether(1) });
          let infoA = await instance.investorInfo(addr1);
          assert.equal(infoA[3], true);
        });
        it('event LogNewReferral', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });

          let block = latestBlock();
          let logNewReferral = instance.LogNewReferral({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(logNewReferral);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogNewReferral');
          assert.equal(e.args.addr.toLowerCase(), addr2.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.value.toString(10), ether(1.0333).toString(10));
        });
      });
      context('2 level', () => {
        beforeEach(async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
        });
        it('dont get bonus if referrer2 is sender', async () => {
          let infoB = await instance.investorInfo(addr2);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(addr2);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('dont get bonus if referrer2 is zero', async () => {
          let infoB = await instance.investorInfo(addr2);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, ZERO_ADDRESS], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(ZERO_ADDRESS);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('dont get bonus if referrer2 is referrer1', async () => {
          let infoB = await instance.investorInfo(addr1);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr1], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(addr1);
          assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
        });
        it('dont get bonus if referrer2 is not investor', async () => {
          let infoB = await instance.investorInfo(addr3);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr3], { from: addr2, value: ether(1) });
          let infoA = await instance.investorInfo(addr3);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('check bonus 3% for referrer2', async () => {
          await instance.doInvest([], { from: addr2, value: ether(1) });
          let infoB = await instance.investorInfo(addr2);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2], { from: addr3, value: ether(1) });
          let infoA = await instance.investorInfo(addr2);
          assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
        });
      });

      context('3 level', () => {
        beforeEach(async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([], { from: addr2, value: ether(1) });
        });
        it('dont get bonus if referrer3 is sender', async () => {
          let infoB = await instance.investorInfo(addr3);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2, addr3], { from: addr3, value: ether(1) });
          let infoA = await instance.investorInfo(addr3);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('dont get bonus if referrer3 is zero', async () => {
          let infoB = await instance.investorInfo(addr3);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2, ZERO_ADDRESS], { from: addr3, value: ether(1) });
          let infoA = await instance.investorInfo(ZERO_ADDRESS);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('dont get bonus if referrer3 is referrer1', async () => {
          let infoB = await instance.investorInfo(addr1);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2, addr1], { from: addr3, value: ether(1) });
          let infoA = await instance.investorInfo(addr1);
          assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
        });
        it('dont get bonus if referrer3 is referrer2', async () => {
          let infoB = await instance.investorInfo(addr2);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2, addr2], { from: addr3, value: ether(1) });
          let infoA = await instance.investorInfo(addr2);
          assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
        });
        it('dont get bonus if referrer3 is not investor', async () => {
          let infoB = await instance.investorInfo(addr4);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2, addr4], { from: addr3, value: ether(1) });
          let infoA = await instance.investorInfo(addr4);
          assert.equal(infoA[2].toString(10), '0');
        });
        it('check bonus 3% for referrer3', async () => {
          await instance.doInvest([], { from: addr3, value: ether(1) });
          let infoB = await instance.investorInfo(addr3);
          assert.equal(infoB[2].toString(10), '0');
          await instance.doInvest([addr1, addr2, addr3], { from: addr4, value: ether(1) });
          let infoA = await instance.investorInfo(addr3);
          assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
        });
      });

      it('dont get bonus if sender is referrer', async () => {
        await instance.doInvest([], { from: addr1, value: ether(1) });
        await instance.doInvest([], { from: addr3, value: ether(1) });
        await instance.doInvest([addr1], { from: addr2, value: ether(1) });

        let infoB = await instance.investorInfo(addr3);
        assert.equal(infoB[2].toString(10), '0');
        await instance.doInvest([addr3], { from: addr2, value: ether(1) });
        let infoA = await instance.investorInfo(addr3);
        assert.equal(infoB[2].toString(10), infoA[2].toString(10));
      });
    });
    context('commission', () => {
      it('admin', async () => {
        await instance.setAdminAddr(addr2, { from: owner });
        let a = await instance.adminAddr();
        let balanceB = await getBalance(a);
        await instance.doInvest([], { from: addr1, value: ether(1) });
        let balanceA = await getBalance(a);
        assert.equal(balanceB.plus(ether(0.1)).toString(10), balanceA.toString(10));
      });
      it('payer', async () => {
        await instance.setPayerAddr(addr2, { from: owner });
        let a = await instance.payerAddr();
        let balanceB = await getBalance(a);
        await instance.doInvest([], { from: addr1, value: ether(1) });
        let balanceA = await getBalance(a);
        assert.equal(balanceB.plus(ether(0.07)).toString(10), balanceA.toString(10));
      });
    });
    context('new investor', () => {
      it('check info', async () => {
        let infoB = await instance.investorInfo(addr1);
        assert.equal(infoB[0].toString(10), '0');
        assert.equal(infoB[1].toString(10), '0');
        assert.equal(infoB[2].toString(10), '0');
        assert.equal(infoB[3], false);
        await instance.doInvest([], { from: addr1, value: ether(1) });
        let infoA = await instance.investorInfo(addr1);
        assert.equal(infoA[0].toString(10), ether(1).toString(10));
        assert.equal(infoA[1].toString(10), '0');
        assert.equal(infoA[2].toString(10), '0');
        assert.equal(infoA[3], false);
      });
      it('event LogNewInvestor', async () => {
        await instance.doInvest([], { from: addr1, value: ether(1) });
        let block = latestBlock();
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
        assert.equal(e.args.value.toString(10), ether(1).toString(10));
      });
    });
    context('update investor', () => {
      it('check info', async () => {
        await instance.doInvest([], { from: addr1, value: ether(1) });
        let infoB = await instance.investorInfo(addr1);
        assert.equal(infoB[0].toString(10), ether(1).toString(10));
        assert.equal(infoB[1].toString(10), '0');
        assert.equal(infoB[2].toString(10), '0');
        assert.equal(infoB[3], false);
        await instance.doInvest([], { from: addr1, value: ether(1) });
        let infoA = await instance.investorInfo(addr1);
        assert.equal(infoA[0].toString(10), ether(2).toString(10));
        assert.equal(infoA[1].toString(10), '0');
        assert.equal(infoA[2].toString(10), '0');
        assert.equal(infoA[3], false);
      });
    });
    it('sender balance', async () => {
      let balanceB = await getBalance(addr1);
      await instance.doInvest([], { from: addr1, value: ether(1) });
      let balanceA = await getBalance(addr1);
      assert.equal(balanceB.minus(ether(1)).minus(latestGasUsed() * gasPrice).toString(10), balanceA.toString(10));
    });
    it('contract balance', async () => {
      let balanceB = await getBalance(instance.address);
      await instance.doInvest([], { from: addr1, value: ether(1) });
      let balanceA = await getBalance(instance.address);
      assert.equal(balanceB.plus(ether(0.83)).toString(10), balanceA.toString(10));
    });
    it('setPaymentTime on pull mode', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });

      let infoB = await instance.investorInfo(addr1);
      assert.equal(infoB[0].toString(10), '0');
      assert.equal(infoB[1].toString(10), '0');
      assert.equal(infoB[2].toString(10), '0');
      assert.equal(infoB[3], false);
      await instance.doInvest([], { from: addr1, value: ether(1) });
      let infoA = await instance.investorInfo(addr1);
      assert.equal(infoA[0].toString(10), ether(1).toString(10));
      assert.equal(infoA[1].toString(10), latestTime().toString(10));
      assert.equal(infoA[2].toString(10), '0');
      assert.equal(infoA[3], false);
    });
    it('event LogNewInvesment', async () => {
      await instance.doInvest([], { from: addr1, value: ether(1) });
      let block = latestBlock();
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
      assert.equal(e.args.value.toString(10), ether(1).toString(10));
    });
    it('investmentsNum', async () => {
      let iA = await instance.investmentsNum();
      await instance.doInvest([], { from: addr1, value: ether(1) });
      let iB = await instance.investmentsNum();
      assert.equal(iA.plus(1).toString(10), iB.toString(10));
    });
    it('event LogBalanceChanged', async () => {
      await instance.doInvest([], { from: addr1, value: ether(1) });
      let block = latestBlock();
      let logBalanceChanged = instance.LogBalanceChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logBalanceChanged);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogBalanceChanged');
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.balance.toString(10), ether(0.83).toString(10));
    });
  });
   
  describe('payout()', () => {
    beforeEach(async () => {
      await initContract();
    });
    it('throw on access denied', async () => {
      await instance.doInvest([], { from: addr1, value: ether(1) });
      await assertRevert(instance.payout({ from: addr1 }));
      let a = await instance.latestPayout({ from: addr2 });
      assert.equal(a.toString(10), '0');
    });
    it('check if lates payment time setting to now', async () => {
      await instance.doInvest([], { from: addr1, value: ether(1) });
      await instance.payout({ from: owner });
      let t = latestTime();
      let a = await instance.latestPayout({ from: addr2 });
      assert.equal(a.toNumber(10), t);
    });
    it('throw if latest payment was earlier than 12 hours', async () => {
      await instance.doInvest([], { from: addr1, value: ether(1) });
      await instance.payout({ from: owner });
      let t = latestTime();
      await assertRevert(instance.payout({ from: owner }));
      let a = await instance.latestPayout({ from: addr2 });
      assert.equal(a.toNumber(10), t);
    });
    it('check if lates payment time dont setting to now if payout not done', async () => {
      let addGas = process.env.SOLIDITY_COVERAGE ? 30000 : 0;
      await instance.doInvest([], { from: addr1, value: ether(1) });
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.doInvest([], { from: addr3, value: ether(1) });
      await instance.payout({ from: owner, gas: 100000 + addGas });
      let b = await instance.latestPayout({ from: addr2 });
      await instance.payout({ from: owner, gas: 800000 + addGas });
      let a = await instance.latestPayout({ from: addr2 });
      assert.equal(b.toString(10), a.toString(10));
    });
    context('do sending eth', () => {
      context('without ref bonus', () => {
        it('investor balance', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          let b = await getBalance(addr1);
          await instance.payout({ from: owner });
          let a = await getBalance(addr1);
          assert.equal(b.plus(ether(0.0333)).toString(10), a.toString(10));
        });
        it('contract balance', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          let b = await getBalance(instance.address);
          await instance.payout({ from: owner });
          let a = await getBalance(instance.address);
          assert.equal(b.minus(ether(0.0333)).toString(10), a.toString(10));
        });
        it('event LogPayDividends', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.payout({ from: owner });
          let block = latestBlock();
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
          assert.equal(e.args.value.toString(10), ether(0.0333).toString(10));
        });
      });
      context('with ref bonus', () => {
        it('investor referrer balance', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          let b = await getBalance(addr1);
          await instance.payout({ from: owner });
          let a = await getBalance(addr1);
          assert.equal(b.plus(ether(0.0333)).plus(ether(0.03)).toString(10), a.toString(10));
        });
        it('investor referral balance', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          let b = await getBalance(addr2);
          await instance.payout({ from: owner });
          let a = await getBalance(addr2);
          assert.equal(b.plus(ether(0.03440889)).toString(10), a.toString(10));
        });
        it('contract balance', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          let b = await getBalance(instance.address);
          await instance.payout({ from: owner });
          let a = await getBalance(instance.address);
          assert.equal(b.minus(ether(0.03440889)).minus(ether(0.0633)).toString(10), a.toString(10));
        });
        it('check referrer bonus info', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          let b = await instance.investorInfo(addr1);
          assert.equal(b[2].toString(10), ether(0.03).toString());
          await instance.payout({ from: owner });
          let a = await instance.investorInfo(addr1);
          assert.equal(a[2].toString(10), '0');
        });
        it('event LogPayDividends', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          await instance.payout({ from: owner });
          let block = latestBlock();
          let logPayDividends = instance.LogPayDividends({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(logPayDividends);
          assert.equal(logs.length, 2);
          let e = logs[0];
          assert.equal(e.event, 'LogPayDividends');
          assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.value.toString(10), ether(0.0333).toString(10));
        });
        it('event LogPayReferrerBonus', async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          await instance.payout({ from: owner });
          let block = latestBlock();
          let logPayReferrerBonus = instance.LogPayReferrerBonus({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });
          const logs = await waitEvents(logPayReferrerBonus);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogPayReferrerBonus');
          assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.value.toString(10), ether(0.03).toString(10));
        });
      });
      it('check gas limitation', async () => {
        let addGas = process.env.SOLIDITY_COVERAGE ? 30000 : 0;
        await instance.doInvest([], { from: addr1, value: ether(1) });
        await instance.doInvest([], { from: addr2, value: ether(1) });
        await instance.doInvest([], { from: addr3, value: ether(1) });
        assert(await instance.payout({ from: owner, gas: 100000 + addGas }));
      });
    });
    it('check latest key index to i', async () => {
      let addGas = process.env.SOLIDITY_COVERAGE ? 30000 : 0;
      await instance.doInvest([], { from: addr1, value: ether(1) });
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.doInvest([], { from: addr3, value: ether(1) });
      await instance.payout({ from: owner, gas: 100000 + addGas });
      let fromBlock = latestBlock();
      await instance.payout({ from: owner, gas: 80000 + addGas });
      await instance.payout({ from: owner, gas: 80000 + addGas });
      let toBlock = latestBlock();

      let LogPayDividends = instance.LogPayDividends({}, {
        fromBlock: fromBlock.number,
        toBlock: toBlock.number,
      });

      const logs = await waitEvents(LogPayDividends);
      assert.equal(logs.length, 3);
      assert.equal(
        (logs[0].args.addr.toLowerCase() != logs[1].args.addr.toLowerCase() &&
                logs[0].args.addr.toLowerCase() != logs[2].args.addr.toLowerCase() &&
                logs[1].args.addr.toLowerCase() != logs[2].args.addr.toLowerCase()),
        true
      );
      await assertRevert(instance.payout({ from: owner }));
    });
    it('event LogBalanceChanged', async () => {
      await instance.doInvest([addr1], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      let block = latestBlock();
      let logBalanceChanged = instance.LogBalanceChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
            
      const logs = await waitEvents(logBalanceChanged);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogBalanceChanged');
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.balance.toString(10), ether(0.83 - 0.0333).toString(10));
    });
    it('throw if on pause', async () => {
      await nextWavePush();
      await assertRevert(instance.payout({ from: owner }));
    });
    it('throw on pull pay mode', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });
      await assertRevert(instance.payout({ from: owner }));
    });
  });

  describe('getMyDividends()', () => {
    beforeEach(async () => {
      await initContract();
    });
    it('throw on not paymode - pull', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await assertRevert(instance.getMyDividends({ from: addr2 }));
    });
    it('throw if on pause', async () => {
      await nextWavePush();
      await assertRevert(instance.doInvest([], { from: addr2, value: ether(1) }));
      await assertRevert(instance.getMyDividends({ from: addr2 }));
    });
    it('throw sender not investor', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });
      await increaseTime(duration.hours(25));
      await assertRevert(instance.getMyDividends({ from: addr1 }));
    });
    it('throw if latest payment was earlier than 24 hours', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });
      await increaseTime(duration.hours(25));
      await instance.getMyDividends({ from: addr2 });
      await increaseTime(duration.hours(12));
      await assertRevert(instance.getMyDividends({ from: addr2 }));
    });
    it('set investor payment time to now', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });

      let ib = await instance.investorInfo(addr2);
      assert.equal(ib[1].toString(10), '0');

      await increaseTime(duration.hours(25));
      await instance.getMyDividends({ from: addr2 });
      let ia = await instance.investorInfo(addr2);
      assert.equal(ia[1].toNumber(), latestTime());
    });
    it('set investor payment time to latest push payment if less than it - 24h', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });

      let bb = await getBalance(addr2);
      await increaseTime(duration.hours(25));
      await instance.getMyDividends({ from: addr2 });
      let ba = await getBalance(addr2);
      // only once day
      assert.equal(bb.plus(ether(0.0333)).toString(10), ba.plus(latestGasUsed() * gasPrice).toString(10));
    });

    it('dividents after 5 days', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });
      await increaseTime(duration.hours(25));
      await instance.getMyDividends({ from: addr2 });

      let bb = await getBalance(addr2);
      await increaseTime(duration.days(5) + 1000);
      await instance.getMyDividends({ from: addr2 });
      let ba = await getBalance(addr2);

      assert.equal(bb.plus(ether(5 * 0.0333)).toString(10), ba.plus(latestGasUsed() * gasPrice).toString(10));
    });
        
    context('send eth', () => {
      context('without bonus', () => {
        beforeEach(async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.payout({ from: owner });
          await instance.setPullPaymode({ from: owner });
          await increaseTime(duration.hours(25));
        });
        it('investor balance', async () => {
          let bb = await getBalance(addr1);
          await instance.getMyDividends({ from: addr1 });
          let cost = latestGasUsed() * gasPrice;
          let ba = await getBalance(addr1);
          assert.equal(bb.plus(ether(0.0333)).toString(10), ba.plus(cost).toString(10));
        });
        it('contract balance', async () => {
          let bb = await getBalance(instance.address);
          await instance.getMyDividends({ from: addr1 });
          let ba = await getBalance(instance.address);
          assert.equal(bb.minus(ether(0.0333)).toString(10), ba.toString(10));
        });
        it('event LogPayDividends', async () => {
          await instance.getMyDividends({ from: addr1 });
          let block = latestBlock();
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
          assert.equal(e.args.value.toString(10), ether(0.0333).toString(10));
        });
      });
      context('with bonus', () => {
        beforeEach(async () => {
          await instance.doInvest([], { from: addr1, value: ether(1) });
          await instance.payout({ from: owner });
          await instance.doInvest([addr1], { from: addr2, value: ether(1) });
          await instance.setPullPaymode({ from: owner });
          await increaseTime(duration.hours(25));
        });
        it('investor balance', async () => {
          let bb = await getBalance(addr1);
          await instance.getMyDividends({ from: addr1 });
          let cost = latestGasUsed() * gasPrice;
          let ba = await getBalance(addr1);
          assert.equal(bb.plus(ether(0.0333 + 0.03)).toString(10), ba.plus(cost).toString(10));
        });
        it('contract balance', async () => {
          let bb = await getBalance(instance.address);
          await instance.getMyDividends({ from: addr1 });
          let ba = await getBalance(instance.address);
          assert.equal(bb.minus(ether(0.0333 + 0.03)).toString(10), ba.toString(10));
        });
        it('check info', async () => {
          let infoB = await instance.investorInfo(addr1);
          assert.equal(infoB[0].toString(10), ether(1).toString(10));
          assert.equal(infoB[2].toString(10), ether(0.03));
          await instance.getMyDividends({ from: addr1 });
          let infoA = await instance.investorInfo(addr1);
          assert.equal(infoA[0].toString(10), ether(1).toString(10));
          assert.equal(infoA[2].toString(10), '0');
        });
        it('event LogPayDividends', async () => {
          await instance.getMyDividends({ from: addr1 });
          let block = latestBlock();
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
          assert.equal(e.args.value.toString(10), ether(0.0333).toString(10));
        });
        it('event LogPayReferrerBonus', async () => {
          await instance.getMyDividends({ from: addr1 });
          let block = latestBlock();
          let logPayReferrerBonus = instance.LogPayReferrerBonus({}, {
            fromBlock: block.number,
            toBlock: block.number,
          });

          const logs = await waitEvents(logPayReferrerBonus);
          assert.equal(logs.length, 1);
          let e = logs[0];
          assert.equal(e.event, 'LogPayReferrerBonus');
          assert.equal(e.args.addr.toLowerCase(), addr1.toLowerCase());
          assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
          assert.equal(e.args.value.toString(10), ether(0.03).toString(10));
        });
      });
    });
    it('next wave', async () => {
      await instance.doInvest([0], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });
      for (let i = 0; i < 23; i++) {
        await increaseTime(duration.hours(25));
        await instance.getMyDividends({ from: addr2 });
      }
      await increaseTime(duration.hours(25));
      let wb = await instance.waveStartup();
      await instance.getMyDividends({ from: addr2 });
      let wa = await instance.waveStartup();
      assert.notEqual(wb.toString(10), wa.toString(10));
    });
    it('event LogBalanceChanged', async () => {
      await instance.doInvest([], { from: addr2, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });
      await increaseTime(duration.hours(25));
      await instance.getMyDividends({ from: addr2 });
      let block = latestBlock();
      let logBalanceChanged = instance.LogBalanceChanged({}, {
        fromBlock: block.number,
        toBlock: block.number,
      });
      const logs = await waitEvents(logBalanceChanged);
      assert.equal(logs.length, 1);
      let e = logs[0];
      assert.equal(e.event, 'LogBalanceChanged');
      assert.equal(e.args.when.toString(10), block.timestamp.toString(10));
      assert.equal(e.args.balance.toString(10), ether(0.83 - 2 * 0.0333).toString(10));
    });
  });
    
  describe('fallback', () => {
    beforeEach(async () => {
      await initContract();
    });
    context('do invest if msg.value > 0', () => {
      it('success do inveset', async () => {
        let addGas = process.env.SOLIDITY_COVERAGE ? 100000 : 0;
        let infoB = await instance.investorInfo(addr1);
        assert.equal(infoB[0].toString(10), '0');
        await web3.eth.sendTransaction({
          from: addr1,
          to: instance.address,
          value: ether(1),
          gas: 200000 + addGas,
          gasPrice: gasPrice,
        });
        let infoA = await instance.investorInfo(addr1);
        assert.equal(infoA[0].toString(10), ether(1).toString(10));
      });
      it('check msg.data to address', async () => {
        let addGas = process.env.SOLIDITY_COVERAGE ? 100000 : 0;
        await instance.doInvest([], { from: addr2, value: ether(1) });
        let infoB = await instance.investorInfo(addr2);
        assert.equal(infoB[0].toString(10), ether(1));
        assert.equal(infoB[2].toString(10), '0');
        await web3.eth.sendTransaction({
          from: addr1,
          to: instance.address,
          value: ether(1),
          gas: 200000 + addGas,
          data: addr2.toLowerCase(),
        });
        let infoA = await instance.investorInfo(addr2);
        assert.equal(infoA[2].toString(10), ether(0.03).toString(10));
      });
    });
    it('getMyDividends if msg.value = 0', async () => {
      let addGas = process.env.SOLIDITY_COVERAGE ? 100000 : 0;
      await instance.doInvest([], { from: addr1, value: ether(1) });
      await instance.payout({ from: owner });
      await instance.setPullPaymode({ from: owner });
      await increaseTime(duration.hours(25));
      let infoB = await instance.investorInfo(addr1);
      assert.equal(infoB[0].toString(10), ether(1));

      let bb = await getBalance(addr1);
      await web3.eth.sendTransaction({
        from: addr1,
        to: instance.address,
        value: 0,
        gas: 200000 + addGas,
        gasPrice: gasPrice,
      });
        
      let cost = latestGasUsed() * gasPrice;
      let ba = await getBalance(addr1);
      assert.equal(bb.plus(ether(0.0333)).toString(10), ba.plus(cost).toString(10));
    });
  });
});
