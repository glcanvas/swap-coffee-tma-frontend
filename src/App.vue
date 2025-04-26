<script setup>
import {markRaw, onMounted, ref, watch} from 'vue';
import {TonConnectUI} from '@tonconnect/ui';
import {createSwapWidget} from '@swap-coffee/ui-sdk';
import {tonConnectConfig} from './config';
import WebApp from '@twa-dev/sdk';
import {Address} from "@ton/core";
import {Api} from "@/api.js";

const api = new Api("https://2adc-109-107-181-94.ngrok-free.app");

const MAIN_WINDOW = 0;
const HISTORY_WINDOW = 1;
const windowRew = ref(MAIN_WINDOW);

const historyData = ref([]);

async function setWindow(id) {
  windowRew.value = id;
  if (id === MAIN_WINDOW) {
    initializeSwapWidget();
  } else {
    historyData.value = await api.getLatestTransactions(WebApp.initData);
  }
}

let version = ref(WebApp.version);

const initializeSwapWidget = () => {
  createSwapWidget('#swap-widget-component', {
    theme: "dark",
    locale: "en",
    injectionMode: "tonConnect",
    tonConnectManifest: {
      "url": "https://swap.coffee/tonconnect-manifest.json",
    },
    tonConnectUi: tonConnectUiInstance,
  });
};
const tonConnectUiInstance = ref(null);

tonConnectUiInstance.value = new TonConnectUI(tonConnectConfig);

let isWalletConnected = ref(false);
let walletAddress = ref(null);

async function doConnect() {
  await setProofParams();
  await tonConnectUiInstance.value.openModal();
}

async function doDisconnect() {
  await tonConnectUiInstance.value.disconnect();
}

function fillWallet(wallet) {
  if (wallet == null) {
    return
  }
  walletAddress.value = Address.parse(wallet.account.address).toString({urlSafe: true, bounceabe: false});
}

async function setProofParams() {
  // if (isWalletConnected.value) {
  //   console.log("Already connected, not need to request proof");
  //   return
  // }
  // console.log("Start set proof");
  // tonConnectUiInstance.value.setConnectRequestParameters(null);
  // tonConnectUiInstance.value.setConnectRequestParameters({
  //   state: 'loading',
  // })
  // let text = await api.requestProof();
  // tonConnectUiInstance.value.setConnectRequestParameters({
  //   state: 'ready',
  //   value: {tonProof: text},
  // })
}

setInterval(async () => {
  await setProofParams();
}, 500_000/*ttl*/);

let proof = ref(null);

tonConnectUiInstance.value.onStatusChange(async wallet => {
  isWalletConnected.value = tonConnectUiInstance.value.connected;
  fillWallet(wallet);
  console.log(wallet.connectItems);
  if (wallet.connectItems !== undefined) {
    proof.value = JSON.stringify({
      address: wallet.account.address,
      public_key: wallet.account.publicKey,
      proof: wallet.connectItems.tonProof.proof,
      state_init: wallet.account.walletStateInit
    });

    WebApp.CloudStorage.setItem("proof", proof.value, async (err, isOk) => {
      console.log("CloudStorage.setItem");
      console.log(err);
      console.log(isOk);
      if (err !== null) {
        console.log("Failed to save proof in storage");
        // await tonConnectUiInstance.value.disconnect();
      }
    });

    try {
      // await api.linkUser(WebApp.initData, proof.value);
    } catch (e) {
      // await tonConnectUiInstance.value.disconnect();
    }
  }
}, async error => {
  console.error("Error during status changing:" + error);
});

async function handler(event) {
  console.log('event_transactions_built, details:', event);
  console.log(event);
  let detail = event.detail;
  let routeId = detail.route_id.toString();
  // await api.saveRoute(WebApp.initData, routeId, proof.value);
}

onMounted(async () => {
  isWalletConnected.value = await tonConnectUiInstance.value.connectionRestored;
  fillWallet(tonConnectUiInstance.value.wallet);
  initializeSwapWidget();
  await setProofParams();
  WebApp.CloudStorage.getItem("proof", async (error, value) => {
    if (error !== null) {
      console.log("Failed to get proof, disconnect");
      console.error(error);
      // await tonConnectUiInstance.value.disconnect();
      return;
    }
    console.log("Fetched proof ok!")
    proof.value = value;
    console.log(proof);
  });
  window.addEventListener('event_transactions_built', handler);
});

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  return date.toLocaleString('ru-RU', options);
}
</script>

<template>

  <div>
    <p v-if="isWalletConnected===false">
      <button @click="doConnect">Click to connect</button>
      <br>
    </p>
    <p v-else>
      Already connected: {{ walletAddress }}
      <button @click="doDisconnect">Click to disconnect</button>
    </p>
    <br>
  </div>

  <div>
    <button @click="setWindow(MAIN_WINDOW)">main-window</button>
    <button @click="setWindow(HISTORY_WINDOW)">history-window</button>
  </div>
  <div v-if="windowRew===0">
    <div class="app">
      <p>version: {{ version }}</p>
      <h1 class="title">Swap Widget Example</h1>
      <div id="swap-widget-component"></div>
    </div>
  </div>
  <div v-else>
    <h1>Список транзакций</h1>
    <table>
      <thead>
      <tr>
        <th>Статус</th>
        <th>Адрес</th>
        <th>Дата</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(item, index) in historyData" :key="index">
        <td>{{ item.status }}</td>
        <td>{{ item.address }}</td>
        <td>{{ formatDate(item.date) }}</td>
      </tr>
      </tbody>
    </table>
  </div>

</template>

<style scoped>
.title {
  font-size: 32px;
  margin-bottom: 40px;
  text-align: center;
  text-decoration: underline;
  font-style: italic;
  font-family: "Papyrus", sans-serif;
}

.app {
  background: darkgray;
}

#swap-widget-component {
  margin: 0 auto;
  width: 100%;
  max-width: 450px;
  height: 100vh;
}

@media screen and (max-width: 600px) {
  #swap-widget-component {
    width: 100%;
  }
}
</style>