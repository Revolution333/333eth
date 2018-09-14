// Returns the time of the last mined block in seconds
export default function lastGasUsed () {
  return web3.eth.getBlock('latest').gasUsed;
}
