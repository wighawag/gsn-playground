const {BigNumber} = require("ethers");
module.exports = async ({getNamedAccounts, deployments, getChainId}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const addresses = {
    RelayHub: (await deployments.get("RelayHub")).address,
    DAI: (await deployments.get("DAI")).address,
    WETH: "0x0000000000000000000000000000000000000001", // TODO weth ?
    UniswapRouter: (await deployments.get("UniswapV2Router1")).address,
  }
  console.log({addresses});
  const contract = await deployIfDifferent(
    ["data"],
    "DAIPaymaster",
    {from: deployer},
    "DAIPaymaster",
    addresses.RelayHub,
    addresses.DAI,
    addresses.WETH,
    addresses.UniswapRouter
  );
  if (contract.newlyDeployed) {
    log(`DAIPaymaster deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
