const {expectRevert, increaseTime, getTime, waitFor, objMap} = require("local-utils");
const {ethers, getNamedAccounts, deployments} = require("@nomiclabs/buidler");
const {BigNumber} = require("@ethersproject/bignumber");
const {Wallet} = require("@ethersproject/wallet");
const {keccak256} = require("@ethersproject/solidity");

async function createUserAsContracts(user, contractNames) {
  const obj = {};
  for (const contractName of contractNames) {
    obj[contractName] = await ethers.getContract(contractName, user);
  }
  obj.address = user;
  return obj;
}

async function setupGSNPlayground() {
  const {users} = await getNamedAccounts();
  await deployments.fixture();
  const usersAsContracts = [];
  for (const user of users) {
    const userObj = await createUserAsContracts(user, ["GSNPlayground"]);
    usersAsContracts.push(userObj);
  }
  let deltaTime = 0;
  return {
    getTime() {
      return Math.floor(Date.now() / 1000) + deltaTime;
    },
    async increaseTime(t) {
      await increaseTime(t);
      deltaTime += t;
    },
    users: usersAsContracts,
  };
}

module.exports = {
  setupGSNPlayground,
};
