module.exports = async ({getNamedAccounts, deployments}) => {
  const {deployer} = await getNamedAccounts();
  const {deployIfDifferent, log} = deployments;

  const dai = await deployments.getOrNull("DAI"); //TODO use guard
  if (dai) {
    return;
  }

  const contract = await deployIfDifferent(
    ["data"],
    "DAI",
    {from: deployer},
    "SimpleERC20TokenWithInitialBalance",
    "1000000000000000000000000000",
    "0x0000000000000000000000000000000000000000"
  );
  if (contract.newlyDeployed) {
    log(`DAI(mock) deployed at ${contract.address} for ${contract.receipt.gasUsed} gas`);
  }
};
