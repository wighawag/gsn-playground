import { isPrivateWindow } from './utils/web';
import {Wallet} from "@ethersproject/wallet";
import {Web3Provider} from "@ethersproject/providers";
import {Contract} from "@ethersproject/contracts";
import {makeLog} from "./utils/log";
import {writable} from "./utils/store";
import {fetchEthereum, getVendor} from "./utils/builtin"
import {timeout} from "./utils/index.js"
import {proxyContract, proxyWeb3Provider} from "./utils/ethers"
let logger;

const $wallet = {
    builtin: {
      status: undefined, // Probing | Available | None | Error
      error: undefined,
      vendor: undefined
    },
    balance: {
      status: undefined, // Loading | Ready
      amount: undefined,
      error: undefined,
      blockNumber: undefined
    },
    contracts: {
      status: undefined, // Loading | Ready
      error: undefined
    },
    status: undefined, // Loading | Locked | Ready
    address: undefined,
    
    selection: undefined,  // wallet Types available
    selected: undefined,
    
    error: undefined,
  
    pendingUserConfirmation: undefined, // [] array of type of request
};
const $transactions = [];
const walletStore = writable($wallet);
const transactionsStore = writable($transactions);
function addTransaction(obj) {
  $transactions.push(obj);
  transactionsStore.set($transactions);
}
function set(obj) {
  for (let key of Object.keys(obj)) {
    if ($wallet[key] && typeof obj[key] === "object") {
      for (let subKey of Object.keys(obj[key])) { // TODO recursve
        $wallet[key][subKey] = obj[key][subKey];
      }
    } else {
      $wallet[key] = obj[key];
    }
  }
  logger.debug('WALLET', JSON.stringify($wallet, null, '  '));
  walletStore.set($wallet);
}

function reset(fields) {
  if (typeof fields === "string") {
    fields = [fields];
  }
  for(const field of fields) {
    const current = $wallet[field];
    if (typeof current === "object") {
      $wallet[field] = {status:undefined};
    } else {
      $wallet[field] = undefined;
    }
  }
}
// //////////////////////////////////////////////////////////////////////////////

let _ethersProvider;
let _builtinProvider;
let _chainConfigs;

function isHex(value) {
  return typeof value === 'string' && value.length > 2 && value.slice(0,2).toLowerCase() === "0x";
}

function toDecimal(value) {
  if (isHex(value)) {
    return "" + parseInt(value.slice(2));
  }
  return value;
}

function toHex(value) {
  if (isHex(value)) {
    return value;
  }
  return "0x" + parseInt(value).toString(16);
}

function requestUserAttention(type) {
  if ($wallet.pendingUserConfirmation) {
    $wallet.pendingUserConfirmation.push(type);
  } else {
    $wallet.pendingUserConfirmation = [type];
  }
  set({pendingUserConfirmation: $wallet.pendingUserConfirmation});
}
function cancelUserAttention(type) {
  if ($wallet.pendingUserConfirmation) {
    const index = $wallet.pendingUserConfirmation.indexOf(type);
    if (index >= 0) {
      $wallet.pendingUserConfirmation.splice(index, 1);
      if ($wallet.pendingUserConfirmation.length === 0) {
        $wallet.pendingUserConfirmation = undefined;
      }
      set({pendingUserConfirmation: $wallet.pendingUserConfirmation});
    }
  }
}

const _observers = {
  onTxRequested: (transaction) => {
    requestUserAttention("transaction");
  },
  onTxCancelled: (error) => {
    cancelUserAttention("transaction");
  },
  onTxSent: (tx) => {
    cancelUserAttention("transaction");
  },
  onSignatureRequested: (message) => {
    requestUserAttention("signature");
  },
  onSignatureCancelled: (error) => {
    cancelUserAttention("signature");
  },
  onSignatureReceived: (signature) => {
    cancelUserAttention("signature");
  },
  onContractTxRequested: ({name, method, overrides, outcome}) => {
    // console.log("onContractTxRequest", {name, method, overrides, outcome});
  },
  onContractTxCancelled: (error) => {
  },
  onContractTxSent: ({hash, name, method, overrides, outcome}) => {
    console.log("onContractTxSent", {hash, name, method, overrides, outcome});
    addTransaction({hash, name, method, overrides, outcome});
  }
}

async function setupChain(address) {
  set({chain: {status: 'Loading'}});

  let contractsToAdd = {};
  let contractsInfos = {};
  const {chainId} = await _ethersProvider.getNetwork();
  if (_chainConfigs) {
    const chainConfigs = _chainConfigs;
    if (typeof chainConfigs === "function") {
      chainConfigs = await chainConfigs(chainId);
    }
    if (chainConfigs.chainId) {
      if (chainId == chainConfigs.chainId || chainId == toDecimal(chainConfigs.chainId)) {
        contractsInfos = chainConfigs.contracts;
      } else {
        const error = new Error(`chainConfig only available for ${chainConfigs.chainId} , not available for ${chainId}`);
        set({chain: {error, chainId, notSupported: true}});
        throw error;
      }
    } else {
      const chainConfig = chainConfigs[chainId] || chainConfigs[toHex(chainId)];
      if (!chainConfig) {
        const error = new Error(`chainConfig not available for ${chainId}`);
        set({chain: {error, chainId, notSupported: true}});
        throw error;
      } else {
        contractsInfos = chainConfig.contracts;
      }
    }
    for (const contractName of Object.keys(contractsInfos)) {
      if (contractName === "status") {
        const error = new Error(`invalid name for contract : "status"`)
        set({chain: {error}});
        throw error;
      }
      if (contractName === "error") {
        const error = new Error(`invalid name for contract : "error"`)
        set({chain: {error}});
        throw error;
      }
      const contractInfo = contractsInfos[contractName];
      contractsToAdd[contractName] = proxyContract(new Contract(contractInfo.address, contractInfo.abi, _ethersProvider.getSigner(address)), contractName, _observers);
    }
  }
  set({
    chain: {
      status: 'Ready',
      chainId
    },
    contracts: {
      ...contractsToAdd,
      toJSON() {
        const obj = {};
        for (const contractName of Object.keys(contractsInfos)) {
          obj[contractName] = {
            address: contractsInfos[contractName].address,
            // abi: contractsInfos[contractName].abi
          }
        }
        return obj;
      }
    }
  }); // TODO None ?
}

async function select(type) {
  if (!type) {
    if (!$wallet.selection || $wallet.selection.length === 0) {
      type = "builtin";
    } else if($wallet.selection.length === 1) {
      type = $wallet.selection[0];
    } else {
      const message = `No Wallet Type Specified, choose from ${$wallet.selection}`;
      // set({error: {message, code: 1}}); // TODO code
      throw new Error(message);
    }
  }
  if (type == "builtin" && $wallet.builtin.status === "None") {
    const message = `No Builtin Wallet`;
    // set({error: {message, code: 1}}); // TODO code
    throw new Error(message);
  } // TODO other type: check if module registered
  
  reset(["address", "status", "message", "selected", "lock"]);
  set({selected: type, previousType: $wallet.selected, status: "Loading", error: undefined});
  _ethersProvider = null;
  if (type === 'builtin') {
    await probeBuiltin();
    _ethersProvider = _builtinProvider;
  } else {
    // TODO load module _ethersProvider = proxyWeb3Provider(new Web3Provider(web3Provider), _observers);
  }

  if (!_ethersProvider) {
    const message = `no provider found for wallet type ${type}`
    set({error: {message, code: 1}}); // TODO code
    throw new Error(message);
  }

  let accounts;
  try {
    if ($wallet.builtin.vendor === "Metamask") {
      accounts = await timeout(1000, _ethersProvider.listAccounts(), {error: `Metamask timed out. Please reload the page (see <a href="https://github.com/MetaMask/metamask-extension/issues/7221">here</a>)`}); // TODO timeout checks (metamask, portis)
    } else {
      // TODO timeout warning
      accounts = await timeout(20000, _ethersProvider.listAccounts());
    }
  } catch (e) {
    set({error: e});
    throw e;
  }
  const address = accounts && accounts[0];
  if (address) {
    set({
      address,
      status: 'Ready'
    });
    await setupChain(address);
  } else {
    set({
      address: undefined,
      status: 'Locked',
    });
  }
  
}

let probing;
function probeBuiltin(config = {}) {
  if (probing) {
    return probing;
  }
  probing = new Promise(async (resolve, reject) => {
    if ($wallet.builtin.status) {
      return resolve();
    }
    set({builtin: {status: "Probing"}});
    try {
      let ethereum = await fetchEthereum();
      if (ethereum) {
        _builtinProvider = proxyWeb3Provider(new Web3Provider(ethereum), _observers);
        set({builtin: {status: "Available", vendor: getVendor(ethereum)}}); 
        // if (config.metamaskReloadFix && $wallet.builtin.vendor === "Metamask") {
        //   // see https://github.com/MetaMask/metamask-extension/issues/7221
        //   await timeout(1000, _builtinProvider.send("eth_chainId", []), () => {
        //     // window.location.reload();
        //     console.log('RELOAD');
        //   }); 
        // }
      } else {
        set({builtin: {status: "None", vendor: undefined}});
      }
    } catch (e) {
      set({builtin: {status: "Error", message: e.message || e, vendor: undefined}});
      return reject(e);
    }
    resolve();
  });
  return probing;
}

// function autoSelect() {
//   if (!$wallet.selection || $wallet.selection.length === 0 || ($wallet.selection.length === 1 && $wallet.selection[0] === "builtin")) {
//    // try to get account directly if possible (TODO: need to handle Opera quircks, also Brave)
//     return select({
//       provider: builtinProvider,
//       type: "builtin"
//     });
//   }
// }

async function connect(type) {
  await select(type);
  if ($wallet.status === "Locked") {
    return unlock();
  }
  return true;
}

function aknowledgeError(field) {
  if (field === "builtin") {

  }
}

let unlocking;
function unlock() {
  if (unlocking) {
    return unlocking;
  }
  let resolved = false;
  const p = new Promise(async (resolve, reject) => {
    // TODO Unlocking to retry // TODO add timeout
    if ($wallet.status === "Locked") {
      requestUserAttention("unlock");
      let accounts;
      try {
        accounts = await _ethersProvider.send("eth_requestAccounts", []);
      } catch (e) {
        accounts = [];
      }
      if (accounts.length > 0) {
        const address = accounts[0];
        cancelUserAttention("unlock")
        set({
          address,
          status: 'Ready'
        });
        await setupChain(address);
      } else {
        cancelUserAttention("unlock");
        unlocking = null;
        resolved = true;
        return resolve(false);
      }
      unlocking = null;
      resolved = true;
      return resolve(true);
    } else {
      resolved = true;
      return reject(new Error(`Not Locked`));
    }
  });
  if (!resolved) {
    unlocking = p;
  }
  return p;
}

// /////////////////////////////////////////////////////////////////////////////////
export default (config) => {
  config = {...(config || {})};
  config.builtin = config.builtin || {};
  const {log, debug, chainConfigs, builtin} = config;

  _chainConfigs = chainConfigs;
  logger = makeLog(log);
  if (debug && typeof window !== 'undefined') {
    window.$wallet = $wallet;
    window.$transactions = $transactions;
  }
  
  if (process.browser && config.builtin.autoProbe) {
    probeBuiltin(config.builtin);
  }

  return {
    transactions: {
      subscribe: transactionsStore.subscribe
    },
    wallet: {
      subscribe: walletStore.subscribe,
      probeBuiltin,
      connect,
      unlock,
      get contracts() {
        return $wallet.contracts; // TODO remove status ?
      },
      // logout,
      get address() {
        return $wallet.address;
      },
      get provider() {
        return _ethersProvider;
      },
      // get fallBackProvider() {
      //   return _fallBackProvider;
      // }
    }
  };
};