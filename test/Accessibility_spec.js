import getAccounts from './helpers/getAccounts';
import assertRevert from './helpers/assertRevert';
const Accessibility = artifacts.require('./contracts/test/TestAccessibility.sol');

let instance, owner, addr1;

let initContract = async function () {
  instance = await Accessibility.new({ from: owner });
};

contract('Accessibility', () => {
  before(async function () {
    let accs = await getAccounts();
    owner = accs[0];
    addr1 = accs[1];
    await initContract();
  });
  describe('only owner', () => {
    it('throw if not owner', async () => {
      await assertRevert(instance.accessOnlyOwner({ from: addr1 }));
    });

    it('success if owner', async () => {
      await instance.accessOnlyOwner({ from: owner });
    });
  });
  describe('disown', () => {
    it('success', async () => {
      await instance.doDisown({ from: owner });
    });
    it('access denied', async () => {
      await assertRevert(instance.accessOnlyOwner({ from: owner }));
    });
  });
});
