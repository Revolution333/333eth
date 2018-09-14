export default function checkPublicABI (contract, expectedPublic) {
  let actualPublic = [];
  for (let method of contract.abi) {
    if (method.type === 'function') actualPublic.push(method.name);
  };

  for (let method of actualPublic) {
    let index = expectedPublic.indexOf(method);
    assert.isAtLeast(index, 0, (`#${method} is NOT expected to be public`));
  }

  for (let method of expectedPublic) {
    let index = actualPublic.indexOf(method);
    assert.isAtLeast(index, 0, (`#${method} is expected to be public`));
  }
};
