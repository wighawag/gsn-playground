module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const dai = await deployments.get("DAI");

  const forwarderRegistry = await deployments.get("ForwarderRegistry");
  const gsnForwarder = await deployments.get("Forwarder");

  const contract = await deployIfDifferent(
    ["data"],
    "GSNPlayground",
    {from: deployer},
    "GSNPlayground",
    forwarderRegistry.address,
    gsnForwarder.address
  );
  if (contract.newlyDeployed) {
    log(`GSNPlayground deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
