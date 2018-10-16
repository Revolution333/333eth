// wraps web3 sync/callback function into a Promise
export function web3AsynWrapperArg (web3Fun) {
  return function (arg) {
    return new Promise((resolve, reject) => {
      web3Fun(arg, (e, data) => e ? reject(e) : resolve(data));
    });
  };
}

export function web3AsynWrapper (web3Fun) {
  return function () {
    return new Promise((resolve, reject) => {
      web3Fun((e, data) => e ? reject(e) : resolve(data));
    });
  };
}
