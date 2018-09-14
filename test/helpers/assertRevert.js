import EVMRevert from './EVMRevert';
export default async promise => {
  try {
    await promise;
    assert.fail('Expected ' + EVMRevert + 'not received');
  } catch (error) {
    const revertFound = error.message.search(EVMRevert) >= 0;
    assert(revertFound, 'Expected "' + EVMRevert + `", got ${error} instead`);
  }
};
