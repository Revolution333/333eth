import { web3AsynWrapperArg } from './web3AsynWrapper';

export default async function sendTransaction (tx) {
  const b = await web3AsynWrapperArg(web3.eth.sendTransaction)(tx);
  return b;
}
