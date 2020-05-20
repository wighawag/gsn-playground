const {BigNumber} = require("ethers");
module.exports = async ({getNamedAccounts, deployments, ethers, getChainId}) => {
  const {deployer} = await getNamedAccounts();
  const {log, sendTxAndWait} = deployments;

  const DAIPaymaster = await ethers.getContract("DAIPaymaster", deployer);
  await DAIPaymaster.deposit({value: BigNumber.from("1000000000000000000")});
};
