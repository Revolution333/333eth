export default async function getBalance (account) {
  let a = await web3.eth.getBalance(account);
  return a;
}
