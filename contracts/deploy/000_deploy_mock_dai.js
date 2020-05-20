const {BigNumber} = require("ethers");
module.exports = async ({getNamedAccounts, deployments, getChainId}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const chainId = BigNumber.from(await getChainId()).toString();
  const dai = await deployments.getOrNull("DAI"); //TODO use guard
  if (dai) {
    return;
  }

  const contract = await deployIfDifferent(
    ["data"],
    "DAI",
    {from: deployer},
    "WithPermit",
    "1000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
    chainId
  );
  if (contract.newlyDeployed) {
    log(`DAI(mock) deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
