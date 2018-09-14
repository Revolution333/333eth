import RPCInvalidJSON from './RPCInvalidJSON';
export default async promise => {
  try {
    await promise;
    assert.fail('Expected ' + RPCInvalidJSON + 'not received');
  } catch (error) {
    const revertFound = error.message.search(RPCInvalidJSON) >= 0;
    assert(revertFound, 'Expected "' + RPCInvalidJSON + `", got ${error} instead`);
  }
};
