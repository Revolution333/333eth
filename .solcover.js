module.exports = {
    norpc: false,
    testCommand: 'SOLIDITY_COVERAGE=true ../node_modules/.bin/truffle test --network coverage',
    skipFiles: [
        'tests/TestAccessibility.sol',
        'tests/TestPaymentSystem.sol',
        'tests/TestPercent.sol',
        'tests/TestToAddress.sol',
        'tests/TestZero.sol',
        'SafeMath.sol',
    ],
    port: 8555
}
