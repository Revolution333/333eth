// Returns the time of the last mined block in seconds
import { web3AsynWrapperArg } from './web3AsynWrapper';

// export default function latestTime() {
//   return web3AsynWrapper(web3.eth.getBalance)(addr);
// }

export default async function latestTime () {
  let b = await web3AsynWrapperArg(web3.eth.getBlock)('latest');
  return b.timestamp;
}
