export default async function getAccounts () {
  let Accounts = await web3.eth.accounts;
  return Accounts.slice(1);
}
