import WalletStore from "web3w";
import contractsInfo from "contractsInfo";

const { wallet, transactions } = WalletStore({
  log: console,
  debug: true,
  chainConfigs: contractsInfo,
  builtin: { autoProbe: true, metamaskReloadFix: true }
});

// TODO remove
if (typeof window !== "undefined") {
  console.log("adding to global");
  window.wallet = wallet;
  window.transactions = transactions;
}

export { wallet, transactions };
