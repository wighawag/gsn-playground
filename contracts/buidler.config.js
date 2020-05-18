require("dotenv").config();
const fs = require("fs");
const {Wallet, utils} = require("ethers");
const {parseEther} = utils;
usePlugin("buidler-deploy");
usePlugin("buidler-ethers-v5");

let mnemonic = process.env.MNEMONIC;
if (!mnemonic || mnemonic === "") {
  const mnemonicPath = process.env.MNEMONIC_PATH;
  if (mnemonicPath && mnemonicPath !== "") {
    mnemonic = fs.readFileSync(mnemonicPath).toString();
  }
}

let mainnetMnemonic = process.env.MNEMONIC_MAINNET;
// MNEMONIC_PATH_MAINNET ?

if (!mnemonic || mnemonic === "") {
  try {
    mnemonic = fs.readFileSync(".mnemonic").toString();
  } catch (e) {}
}

if (!mnemonic) {
  mnemonic = Wallet.createRandom().mnemonic.phrase;
}

if (!mainnetMnemonic || mainnetMnemonic === "") {
  try {
    mainnetMnemonic = fs.readFileSync(".mnemonic_mainnet").toString();
  } catch (e) {}
}

if (!mainnetMnemonic || mainnetMnemonic === "") {
  mainnetMnemonic = mnemonic;
}

const accounts = mnemonic
  ? {
      mnemonic,
    }
  : undefined;
const mainnetAccounts = mainnetMnemonic
  ? {
      mnemonic: mainnetMnemonic,
    }
  : undefined;

const defaultBalance = parseEther("10000").toHexString();
const buidlerevmAccounts = [];
for (let i = 0; i < 10; i++) {
  buidlerevmAccounts.push({
    privateKey: Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + i).privateKey,
    balance: defaultBalance,
  });
}

module.exports = {
  solc: {
    version: "0.6.5",
    optimizer: {
      enabled: true,
      runs: 2000,
    },
  },
  paths: {
    sources: "src",
  },
  networks: {
    buidlerevm: {
      accounts: buidlerevmAccounts,
    },
    localhost: {
      live: true,
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_TOKEN,
      accounts,
    },
    kovan: {
      url: "https://kovan.infura.io/v3/" + process.env.INFURA_TOKEN,
      accounts,
    },
    goerli: {
      url: "https://goerli.infura.io/v3/" + process.env.INFURA_TOKEN,
      accounts,
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + process.env.INFURA_TOKEN,
      accounts: mainnetAccounts,
    },
  },
  namedAccounts: {
    deployer: 0,
    users: "from:3",
  },
};
