import { web3AsynWrapperArg } from './web3AsynWrapper';

export default async function latestBlock () {
  const b = await web3AsynWrapperArg(web3.eth.getBlock)('latest'); ;
  return b;
}
