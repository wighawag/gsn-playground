import { writable } from "svelte/store";
import {wallet} from "./wallet";
import { Web3Provider } from "@ethersproject/providers";
const { RelayProvider, configureGSN } = require('@opengsn/gsn')

let _configuration;
let _provider;
let _ethersProvider;
let _ethersSigner;

const $data = {};
const { subscribe, set } = writable($data);

function _set(data) {
  Object.assign($data, data);
  set($data);
}

let _approvalData = "0x";
function setApprovalData(approvalData) {
  _approvalData = approvalData;
}

wallet.subscribe((walletData) => {
  if (walletData.chain && walletData.chain.status == "Ready") {
    
    const gsnAddresses = {
      relayHubAddress: walletData.chain.addresses["RelayHub"],
      stakeManagerAddress: walletData.chain.addresses["StakeManager"],
      paymasterAddress: walletData.chain.addresses["DAIPaymaster"],
      forwarderAddress: walletData.chain.addresses["Forwarder"],
    };
    // _configuration  = { relayHubAddress: walletData.chain.addresses["RelayHub"], stakeManagerAddress: walletData.chain.addresses["StakeManager"] };
    // _configuration = configureGSN({
    //   relayHubAddress: walletData.chain.addresses["RelayHub"],
    //   stakeManagerAddress: walletData.chain.addresses["StakeManager"],
    //   paymasterAddress: walletData.chain.addresses["Paymaster"],
    //   forwarderAddress: walletData.chain.addresses["Forwarder"],
    // });

    _configuration = {
      ...gsnAddresses,
      methodSuffix: '_v4',
      jsonStringifyRequest: true,
      // TODO: this is actually a reported bug in MetaMask. Should be:
      // chainId: network.chainId
      // but chainID == networkId on top ethereum networks. See https://chainid.network/
      chainId: window.ethereum.networkVersion
    }

    const dependencies = {
      async asyncApprovalData(relayRequest) {
        console.log({_approvalData});
        return _approvalData;
      }
    };

    _provider = new RelayProvider(wallet.web3Provider, _configuration, dependencies);
    _ethersProvider = new Web3Provider(_provider);

    // TODO remove : use EIP-712 via ethers
    // const account = _provider.newAccount()
    // const from = account.address;
    // _ethersSigner = _ethersProvider.getSigner(from);
    
    // TODO use that isntead
    _ethersSigner = _ethersProvider.getSigner();
    const contracts = {};
    for (const contractName of Object.keys(walletData.contracts)) {
      if (walletData.contracts[contractName]._proxiedContract) {
        contracts[contractName] = walletData.contracts[contractName]._proxiedContract.connect(_ethersSigner);
      }
    }
    _set({ contracts });
  } else {
    _set({ contracts: undefined });
  }
})

let dataStore;
export default dataStore = {
  subscribe,
  setApprovalData,
  get contracts() {
    return $data.contracts;
  },
};

if (typeof window !== "undefined") {
  window.gsn = $data;
}
