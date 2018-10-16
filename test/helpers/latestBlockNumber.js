// Returns the time of the last mined block in seconds
import { web3AsynWrapperArg } from './web3AsynWrapper';

export default async function latestBlockNumber () {
  let b = await web3AsynWrapperArg(web3.eth.getBlock)('latest');
  return b.number;
}
