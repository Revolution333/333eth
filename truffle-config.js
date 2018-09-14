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
      port: 8555,
      network_id: '*', // eslint-disable-line camelcase
      gas: 0xfffffffffff,
      gasPrice: defaultGasPrice,
    },
    testrpc: {
      host: 'localhost',
      gas: 7e6,
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: defaultGasPrice,
    },
    ganache: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      gasPrice: defaultGasPrice,
    },
  },
};
