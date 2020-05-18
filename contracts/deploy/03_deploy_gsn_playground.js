module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const dai = await deployments.get("DAI");

  const contract = await deployIfDifferent(
    ["data"],
    "GSNPlayground",
    {from: deployer},
    "GSNPlayground"
  );
  if (contract.newlyDeployed) {
    log(`GSNPlayground deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
