let accs = "";
let balance = "0x1027e72f1f12813088000000"; // 500 000 000 ether
for (let i = 0; i < 10; i++) {
    accs += ` --account="${"0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b750120"+i}, ${balance}"`
}

module.exports = {
    norpc: false,
    testrpcOptions: `--port 8545 ${accs}`,
    port: 8545,
    testCommand: 'SOLIDITY_COVERAGE=true ../node_modules/.bin/truffle test --network coverage',
    skipFiles: [
        // tests
        'tests/TestRapidGrowthProtection.sol',
        'tests/TestPrivateEntrance.sol',
        'tests/TestAccessibility.sol',
        'tests/TestRevolution2.sol',
        'tests/TestPercent.sol',
        'tests/TestAddress.sol',
        'tests/TestMath.sol',
        'tests/TestZero.sol',
        // mocks 
        'mocks/MockGetMyDividends.sol',
        'mocks/MockRev1Storage.sol',
        'mocks/MockRev2Storage.sol',
        'mocks/MockDoInvest.sol',
        // contracts
        'SafeMath.sol',
    ],
}