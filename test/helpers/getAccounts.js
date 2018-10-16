import { web3AsynWrapper } from './web3AsynWrapper';

export default async function getAccounts () {
  let Accounts = await web3AsynWrapper(web3.eth.getAccounts)();
  return Accounts.slice(1);
}
