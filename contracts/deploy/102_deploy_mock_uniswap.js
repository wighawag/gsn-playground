const {BigNumber} = require("ethers");
module.exports = async ({getNamedAccounts, deployments, getChainId}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const contract = await deployIfDifferent(
    ["data"],
    "UniswapV2Router1",
    {from: deployer, value: BigNumber.from("2000000000000000000")},
    "FakeUniswapV2Router",
    1 // 1 dai for one eth
  );
  if (contract.newlyDeployed) {
    log(`UniswapV2Router1 deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
