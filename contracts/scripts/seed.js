const {getNamedAccounts, ethers, deployments} = require("@nomiclabs/buidler");
const waitFor = (p) => p.then((tx) => tx.wait());

async function main() {
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
