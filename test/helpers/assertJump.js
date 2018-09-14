import EVMThrow from './EVMThrow';
module.exports = function (error) {
  assert.isAbove(error.message.search(EVMThrow), -1, 'Invalid opcode error must be returned');
};
