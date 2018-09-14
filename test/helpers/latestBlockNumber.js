export default function latestBlockNumber () {
  return web3.eth.getBlock('latest').number;
}
