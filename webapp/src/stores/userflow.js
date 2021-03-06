import { writable } from "svelte/store";
import { wallet } from "./wallet";
import gsn from "./gsn";
import { BigNumber } from "@ethersproject/bignumber";
import {defaultAbiCoder} from "@ethersproject/abi";
import {splitSignature} from "@ethersproject/bytes";
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

async function cancel() {
  _set({ flow: undefined, step: undefined, data: undefined });
}
async function acknownledgeSuccess() {
  // TODO automatic ?
  _set({ flow: undefined, step: undefined, data: undefined });
}

let dataStore;
export default dataStore = {
  subscribe,
  cancel,
  acknownledgeSuccess,
  /////////////////////// SET NAME /////////////////////////////
  async setName_start() {
    if ($data.flow) {
      throw new Error(`flow in progress`);
    }
    await wallet.probeBuiltin();
    _set({ flow: "SetUserNameFlow", step: "setName" });
  },
  async setName_confirm(userName, useGSN, useDAI) {
    _set({ step: "SendingTx" });
    console.log({ address: wallet.address, userName, useGSN, useDAI });

    const chainId = wallet.chain.chainId;

    let tx;
    if (useGSN) {
      if (useDAI) {
        const currentAllowance = await wallet.contracts.DAI.callStatic.allowance(wallet.address, wallet.chain.addresses.DAIPaymaster);
        if (currentAllowance.eq(0)) {
          const currentNonce = await wallet.contracts.DAI.callStatic.nonces(wallet.address);
          console.log({currentNonce: currentNonce.toNumber(), chainId})
          const message = {
            holder: wallet.address,
            spender: wallet.chain.addresses.DAIPaymaster,
            nonce: currentNonce.toNumber(),
            expiry: 0, // Math.floor(Date.now() / 1000) + 3600, // TODO
            allowed: true
          };
          console.log({permitMessage : message});
          const eip712Struct = {
            types : {
              EIP712Domain:[
                {name:"name",type:"string"},
                {name:"version",type:"string"},
                {name:"chainId",type:"uint256"},
                {name:"verifyingContract",type:"address"}
              ],
              Permit:[
                {name:"holder",type:"address"},
                {name:"spender",type:"address"},
                {name:"nonce",type:"uint256"},
                {name:"expiry",type:"uint256"},
                {name:"allowed",type:"bool"}
              ],
            },
            domain: {name:"Dai Stablecoin",version:"1",verifyingContract: wallet.chain.addresses.DAI, chainId},
            primaryType: 'Permit',
          };
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
            return cancel();
            return;
          }

          signature = splitSignature(signature);

          const approvalData = defaultAbiCoder.encode(["uint256", "uint256", "uint8", "bytes32", "bytes32"], [
            message.nonce,
            message.expiry,
            signature.v,
            signature.r,
            signature.s
          ]);
          gsn.setApprovalData(approvalData);
        } else {
          gsn.setApprovalData("0x");
          console.log("dai permit for paymaster : " + currentAllowance.toHexString());
        }
        // ////////////////////////////////

      }

      const gsnContracts = useDAI ? gsn.dai_contracts : gsn.contracts;
      
      const forwarder = wallet.chain.addresses["Forwarder"];
      const forwarderIsApproved = await wallet.contracts.ForwarderRegistry.isForwarderFor(wallet.address, forwarder);
      if (forwarderIsApproved) {
        console.log("Forwarder approved : " + forwarder);
        try {
          tx = await gsnContracts.GSNPlayground.setName(
            userName
          );
        } catch (e) {
          console.error(e);
          return cancel();
        }
      } else {

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
          return cancel();
        }
        
        const {to, data} = await wallet.contracts.GSNPlayground.populateTransaction.setName(userName);
        try {
          tx = await gsnContracts.ForwarderRegistry.functions.approveAndForward(signature, to, data, {gasLimit: 3000000}); // gasLimit is necessary else ethers will reject the tx as failing
        } catch(e) {
          console.error(e);
          return cancel();
        }
      }
    } else {
      console.log({userName});
      try {
        tx = await wallet.contracts.GSNPlayground._proxiedContract.functions.setName(userName);
      } catch (e) {
        console.error(e);
        return cancel();
      }
    }
    // _set({ step: "Success", data: { txHash: tx.hash } });
    acknownledgeSuccess();
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
