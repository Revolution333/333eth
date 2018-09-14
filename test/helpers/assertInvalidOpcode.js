import EVMThrow from './EVMThrow';
export default async promise => {
  try {
    await promise;
    assert.fail('Expected ' + EVMThrow + ' not received');
  } catch (error) {
    const revertFound = error.message.search(EVMThrow) >= 0;
    assert(revertFound, 'Expected "' + EVMThrow + `", got ${error} instead`);
  }
};
