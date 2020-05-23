import WalletStore from "web3w";
import contractsInfo from "contractsInfo";
import * as PortisModule from "web3w-portis";

const portisAppID = "4e0bd93c-3f3f-49fc-98d1-763a6ec4f21f"; // TODO
const walletSelection = ["builtin"];

if (process.browser) {
  
  let chainName = process.env.CHAIN;
  if (!chainName || chainName === "") {
    chainName = "localhost";
  }
  let chainId;
  let fallbackUrl;
  switch(chainName) {
    case "kovan":
      chainId = 42;
      break;
    default:
    chainId = 1337;
    fallbackUrl = "http://localhost:8545"
  }
  walletSelection.push(new PortisModule({ dappId: portisAppID, chainId, fallbackUrl }));
}


const { wallet, transactions } = WalletStore({
  log: console,
  debug: true,
  chainConfigs: contractsInfo,
  builtin: { autoProbe: true },
  autoSelectPrevious: true,
  selection: walletSelection
});

// TODO remove
if (typeof window !== "undefined") {
  console.log("adding to global");
  window.wallet = wallet;
  window.transactions = transactions;
}

export { wallet, transactions };
