// Workaround for constrained Windows filesystems where asynchronous realpath
// returns EPERM although the synchronous implementation resolves the path.
// Opt in only for local tooling via NODE_OPTIONS=--require=./scripts/windows-realpath-compat.cjs.
const fs = require("node:fs");

if (process.platform === "win32") {
  const realpath = fs.promises.realpath;
  fs.promises.realpath = async function (path, options) {
    try {
      return await realpath(path, options);
    } catch (error) {
      if (error?.code !== "EPERM") throw error;
      return fs.realpathSync(path, options);
    }
  };
}
