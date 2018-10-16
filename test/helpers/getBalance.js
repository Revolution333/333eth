import { web3AsynWrapperArg } from './web3AsynWrapper';

export default async function getBalance (addr) {
  const b = await web3AsynWrapperArg(web3.eth.getBalance)(addr);
  return b;
}
