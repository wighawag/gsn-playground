const {BigNumber} = require("ethers");
module.exports = async ({getNamedAccounts, deployments, getChainId}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  // TODO remove
  const chainId = BigNumber.from(await getChainId()).toNumber();
  const contract = await deployIfDifferent(
    ["data"],
    "ForwarderRegistry",
    {from: deployer},
    "ForwarderRegistryChainIdWithGSN",
    (await deployments.get("Forwarder")).address,
    chainId
  );
  if (contract.newlyDeployed) {
    log(`ForwarderRegistry deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }

  // TODO :
  // const contract = await deployIfDifferent(["data"], "ForwarderRegistry", {from: deployer}, "ForwarderRegistry");
  // if (contract.newlyDeployed) {
  //   log(`ForwarderRegistry deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  // }
};
