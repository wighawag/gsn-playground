import { writable } from "svelte/store";
import {wallet} from "./wallet";

const $data = {};
const { subscribe, set } = writable($data);

function _set(data) {
  Object.assign($data, data);
  set($data);
}

let _interval;
function listen() {
  stopListenning();
  _interval = setInterval(async () => {
    if (wallet.contracts.DAI) {
      let balance;
      try {
        balance = await wallet.contracts.DAI.callStatic.balanceOf(wallet.address);
      } catch (e) {

      }
      if (balance && _interval) {
        _set({balance});
      }
    }
  }, 1000);
}

function stopListenning() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  _set({balance: undefined});
}

wallet.subscribe((walletData) => {
  if (walletData.chain && walletData.chain.status == "Ready") {
    listen();
  } else {
    stopListenning();
  }
})

let dataStore;
export default dataStore = {
  subscribe,
  get balance() {
    return $data.balance;
  },
};

if (typeof window !== "undefined") {
  window.dai = $data;
}
