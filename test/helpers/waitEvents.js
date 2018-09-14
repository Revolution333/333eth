export default async function waitEvents (event) {
  return new Promise(function (resolve, reject) {
    event.get(function (error, logs) {
      if (error !== null) {
        reject(error);
      }
      resolve(logs);
    });
  });
};
