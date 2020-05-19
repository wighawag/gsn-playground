import { writable } from "svelte/store";
import { wallet } from "./wallet";
import gsn from "./gsn";
import { BigNumber } from "@ethersproject/bignumber";
import { EIP712Signer } from "../lib/eip712";

function wait(t, v) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), t * 1000);
  });
}

const $data = {
  flow: undefined,
  step: undefined
};
const { subscribe, set } = writable($data);

// let $wallet;
// wallet.subscribe(walletData => {
//   $wallet = walletData;
//   _setStep($data, walletData);
// });

function _set(obj) {
  for (let key of Object.keys(obj)) {
    if ($data[key] && typeof obj[key] === "object") {
      for (let subKey of Object.keys(obj[key])) {
        // TODO recursve
        $data[key][subKey] = obj[key][subKey];
      }
    } else {
      $data[key] = obj[key];
    }
  }
  console.debug("USERFLOW", JSON.stringify($data, null, "  "));
  set($data);
}

// function _setStep($data, $wallet) {
//   // if ($wallet.status)
// }

let dataStore;
export default dataStore = {
  subscribe,
  async cancel() {
    _set({ flow: undefined, step: undefined, data: undefined });
  },
  async acknownledgeSuccess() {
    // TODO automatic ?
    _set({ flow: undefined, step: undefined, data: undefined });
  },
  /////////////////////// SET NAME /////////////////////////////
  async setName_start() {
    if ($data.flow) {
      throw new Error(`flow in progress`);
    }
    await wallet.probeBuiltin();
    _set({ flow: "SetUserNameFlow", step: "setName" });
  },
  async setName_confirm(userName, useGSN) {
    _set({ step: "SendingTx" });
    console.log({ address: wallet.address, userName, useGSN });
    let tx;
    if (useGSN) {
      const forwarder = wallet.chain.addresses["Forwarder"];
      const forwarderIsApproved = await wallet.contracts.ForwarderRegistry.isForwarderFor(wallet.address, forwarder);
      if (forwarderIsApproved) {
        console.log("Forwarder approved : " + forwarder);
        tx = await gsn.contracts.GSNPlayground.setName(
          userName
        );
      } else {
        const chainId = wallet.chain.chainId;

        // TODO: this is actually a reported bug in MetaMask. Should be:
        // chainId: network.chainId
        // but chainID == networkId on top ethereum networks. See https://chainid.network/
        // const chainId = window.ethereum.networkVersion;

        const nonce = await wallet.contracts.ForwarderRegistry.callStatic.getNonce(wallet.address, forwarder);
        const message = {
          signer: wallet.address,
          nonce : nonce.toNumber(), // TODO check metamask
          forwarder,
          approved: true
        };
        const eip712Struct = {
          types : {
            EIP712Domain: [
              {name: 'name', type: 'string'},
              {name: 'chainId', type: 'uint256'}
            ],
            ApproveForwarder: [
              {name: 'signer', type: 'address'},
              {name: 'nonce', type: 'uint256'},
              {name: 'forwarder', type: 'address'},
              {name: 'approved', type: 'bool'},
            ]
          },
          domain: {
            name: 'ForwarderRegistry',
            chainId
          },
          primaryType: 'ApproveForwarder',
        };
        const eip712Signer = new EIP712Signer(eip712Struct)
        const eip712Message = JSON.stringify({
          ...eip712Struct,
          message
        });

        let signature;
        try {
          signature = await wallet.provider.send('eth_signTypedData_v4', [wallet.address, eip712Message]);
        } catch (e) {

        }

        if (!signature) {
          console.log('No Sig');
          _set({ step: "setName" }); // TODO back function
          return;
        }
        

        // bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId)");
        // bytes32 constant EIP712DOMAIN_NAME = keccak256("ForwarderRegistry");
        // bytes32 constant APPROVAL_TYPEHASH = keccak256("ApproveForwarder(address signer,uint256 nonce,address forwarder,bool approved)");
        
        const {to, data} = await wallet.contracts.GSNPlayground.populateTransaction.setName(userName);
        tx = await gsn.contracts.ForwarderRegistry.approveAndForward(signature, to, data, {gasLimit: 3000000}); // gasLimit is necessary else ethers will reject the tx as failing
      }
    } else {
      tx = await wallet.contracts.GSNPlayground.setName(
        userName
      );
    }
    _set({ step: "Success", data: { txHash: tx.hash } });
  },
  ///////////////////////////////////////////////////////////
  ////////////////// SET NAME VIA GSN ///////////////////////
  // async setNameGSN_start() {
  //   if ($data.flow) {
  //     throw new Error(`flow in progress`);
  //   }
  //   await wallet.probeBuiltin();
  //   _set({ flow: "SetUserNameViaGSN", step: "setName" });
  // },
  // async setNameGSN_confirm(userName) {
  //   _set({ step: "SendingTx" });
  //   console.log({ address: wallet.address, userName });
  //   const tx = await gsn.contracts.GSNPlayground.setName(
  //     userName
  //   );
  //   _set({ step: "Success", data: { txHash: tx.hash } });
  // },
  ///////////////////////////////////////////////////////////
};

if (typeof window !== "undefined") {
  window.userflow = $data;
}
