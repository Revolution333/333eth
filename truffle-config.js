require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten');

const defaultGasPrice = process.env.SOLIDITY_COVERAGE
  ? 0x01
  : 100000000000;

// start ganache-cli if needed
if (process.env.USE_GANACHE) {
  var ganache = require('ganache-core');
  var accounts = [];
  for (let i = 0; i < 10; i++) {
    accounts.push({
      balance: '0x295be96e64066972000000', // 50 000 000 ether
      secretKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b750120' + i,
    });
  }
  let props = { accounts: accounts, locked: false, gasLimit: 0xfffffffffff };
  var server = ganache.server(props);
  server.listen(8545);
}

module.exports = {
  gasPrice: defaultGasPrice,
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  networks: {
    development: {
      host: 'localhost',
      gas: 7e6,
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: defaultGasPrice,
    },
    ropsten: {
      provider: ropstenProvider,
      network_id: 3, // eslint-disable-line camelcase
    },
    coverage: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
      gas: 0xfffffffffff,
      gasPrice: defaultGasPrice,
    },
    ganache: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: defaultGasPrice,
      port: 8545,
    },
  },
};
