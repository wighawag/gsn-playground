  import { writable } from "svelte/store";
  import {wallet} from "./wallet";
  import { Web3Provider } from "@ethersproject/providers";
  const { RelayProvider, configureGSN } = require('@opengsn/gsn')

  let _configuration;
  let _provider;
  let _ethersProvider;
  let _ethersSigner;

  let _dai_configuration;
  let _dai_provider;
  let _dai_ethersProvider;
  let _dai_ethersSigner;

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

  wallet.subscribe( async (walletData) => {
    if (walletData.chain && walletData.chain.status == "Ready") {

      const minGasPrice = (await wallet.provider.getGasPrice()).toNumber() * 2;

      _configuration = {
        relayHubAddress: walletData.chain.addresses["RelayHub"],
        stakeManagerAddress: walletData.chain.addresses["StakeManager"],
        paymasterAddress: walletData.chain.addresses["Paymaster"],
        forwarderAddress: walletData.chain.addresses["Forwarder"],

        methodSuffix: '_v4',
        jsonStringifyRequest: true,
        // TODO: this is actually a reported bug in MetaMask. Should be:
        // chainId: network.chainId
        // but chainID == networkId on top ethereum networks. See https://chainid.network/
        chainId: walletData.chain.chainId,
        verbose: true,
        relayLookupWindowBlocks: 100000,
        minGasPrice
      }

      _dai_configuration = {
        relayHubAddress: walletData.chain.addresses["RelayHub"],
        stakeManagerAddress: walletData.chain.addresses["StakeManager"],
        paymasterAddress: walletData.chain.addresses["DAIPaymaster"],
        forwarderAddress: walletData.chain.addresses["Forwarder"],

        methodSuffix: '_v4',
        jsonStringifyRequest: true,
        // TODO: this is actually a reported bug in MetaMask. Should be:
        // chainId: network.chainId
        // but chainID == networkId on top ethereum networks. See https://chainid.network/
        chainId: walletData.chain.chainId,
        verbose: true,
        relayLookupWindowBlocks: 100000,
        minGasPrice
      }


      _provider = new RelayProvider(wallet.web3Provider, _configuration);
      _ethersProvider = new Web3Provider(_provider);
      _ethersSigner = _ethersProvider.getSigner();


      const dependencies = {
        async asyncApprovalData(relayRequest) {
          console.log({_approvalData});
          return _approvalData;
        }
      };
      _dai_provider = new RelayProvider(wallet.web3Provider, _dai_configuration, dependencies);
      _dai_ethersProvider = new Web3Provider(_dai_provider);
      _dai_ethersSigner = _dai_ethersProvider.getSigner();

      const contracts = {};
      const dai_contracts = {};
      for (const contractName of Object.keys(walletData.contracts)) {
        if (walletData.contracts[contractName]._proxiedContract) {
          contracts[contractName] = walletData.contracts[contractName]._proxiedContract.connect(_ethersSigner);
          dai_contracts[contractName] = walletData.contracts[contractName]._proxiedContract.connect(_dai_ethersSigner);
        }
      }
      _set({ contracts, dai_contracts });
    } else {
      _set({ contracts: undefined, dai_contracts: undefined });
    }
  })

  let dataStore;
  export default dataStore = {
    subscribe,
    setApprovalData,
    get contracts() {
      return $data.contracts;
    },
    get dai_contracts() {
      return $data.dai_contracts;
    },
  };

  if (typeof window !== "undefined") {
    window.gsn = $data;
  }
