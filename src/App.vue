<script setup>
import {markRaw, onMounted, ref, watch} from 'vue';
import {TonConnectUI} from '@tonconnect/ui';
import {createSwapWidget} from '@swap-coffee/ui-sdk';
import {tonConnectConfig} from './config';
import WebApp from '@twa-dev/sdk';
import {Address} from "@ton/core";
import {Api} from "@/api.js";
import walletIcon from "@/assets/wallet-icon.svg"
import disconnectIcon from "@/assets/disconnect.svg"
import logoMobile from "@/assets/logo-mob.svg"

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
    console.log(historyData.value);
  }
}

let version = ref(WebApp.version);

const initializeSwapWidget = () => {
  createSwapWidget('#swap-widget-component', {
    theme: "light",
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
let walletInfo = ref(null);

async function doConnect() {
  await setProofParams();
  await tonConnectUiInstance.value.openModal();
}

async function doDisconnect() {
  await tonConnectUiInstance.value.disconnect();
}

function getTrimAddress() {
  let address = walletAddress.value;
  if (address) {
    let stringLength = 4;
    let firstHalf = address.substring(0, stringLength);
    let secondHalf = address.substring(address.length - stringLength);
    return firstHalf + '...' + secondHalf;
  } else {
    return '';
  }
}

function fillWallet(wallet) {
  if (wallet == null) {
    return
  }

  fillWalletInfo(wallet);
  walletAddress.value = Address.parse(wallet.account.address).toString({urlSafe: true, bounceabe: false});
}

function fillWalletInfo(wallet) {
  if (wallet == null) {
    return
  }
  console.log(wallet.account);
  walletInfo.value = wallet.account;
}

async function setProofParams() {
  if (isWalletConnected.value) {
    console.log("Already connected, not need to request proof");
    return
  }
  console.log("Start set proof");
  tonConnectUiInstance.value.setConnectRequestParameters(null);
  tonConnectUiInstance.value.setConnectRequestParameters({
    state: 'loading',
  })
  let text = await api.requestProof();
  tonConnectUiInstance.value.setConnectRequestParameters({
    state: 'ready',
    value: {tonProof: text},
  })
}

setInterval(async () => {
  await setProofParams();
}, 500_000/*ttl*/);

let proof = ref(null);

tonConnectUiInstance.value.onStatusChange(async wallet => {
  isWalletConnected.value = tonConnectUiInstance.value.connected;
  fillWallet(wallet);
  if (wallet.connectItems !== undefined) {
    proof.value = JSON.stringify({
      address: wallet.account.address,
      public_key: wallet.account.publicKey,
      proof: wallet.connectItems.tonProof.proof,
      state_init: wallet.account.walletStateInit
    });

    WebApp.CloudStorage.setItem("proof", proof.value, async (err, isOk) => {
      console.log("CloudStorage.setItem");
      if (err !== null) {
        console.log("Failed to save proof in storage");
        await tonConnectUiInstance.value.disconnect();
      }
    });

    try {
      await api.linkUser(WebApp.initData, proof.value);
    } catch (e) {
      await tonConnectUiInstance.value.disconnect();
    }
  }
}, async error => {
  console.error("Error during status changing:" + error);
});

async function handler(event) {
  try {
    console.log('event_transactions_built, details:', event);
    console.log(event);
    let detail = event.detail;
    let routeId = detail.route_id.toString();
    await api.saveRoute(WebApp.initData, routeId, proof.value);
  } catch (t) {
    console.error(t);
  }
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
      await tonConnectUiInstance.value.disconnect();
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
  <div class="application">
    <div class="app__header">
      <div
          class="header__info"
      >
        <img :src="logoMobile" class="header__logo" alt="coffee-logo">
      </div>
      <div
          class="header__info"
      >
        <div
            v-show="isWalletConnected"
            class="header__dex-wallet"
        >
          <img :src="walletInfo?.imgUrl" alt="wallet logo" class="header__dex-image"/>
          <p class="header__dex-address">
            {{ getTrimAddress() }}
          </p>
        </div>
        <button
            class="header__dex-button"
            v-if="!isWalletConnected"
            @click="doConnect"
        >
          <img class="wallet-icon" :src="walletIcon" alt="wallet-icon">
          Connect Wallet
        </button>
        <button
            class="header__dex-button"
            @click="doDisconnect"
            v-else
        >
          <img class="wallet-icon disconnect" :src="disconnectIcon" alt="wallet-icon">
          Disconnect
        </button>
      </div>
    </div>
    <div class="menu-buttons__container">
      <p class="tma__version">TMA revision 🚀 {{ version }}</p>
      <button
          class="controls__btn"
          @click="setWindow(MAIN_WINDOW)"
          :class="{ 'active': windowRew === 0 }"
      >
        <span class="btn__text">Widget</span>
      </button>
      <button
          class="controls__btn"
          @click="setWindow(HISTORY_WINDOW)"
          :class="{ 'active': windowRew === 1 }"
      >
        <span class="btn__text">History</span>
      </button>
    </div>

    <div class="app__main">
      <div v-if="windowRew===0">
        <div>
          <div id="swap-widget-component"></div>
        </div>
      </div>
      <div v-else>
        <h1 class="tma__version">TMA Transaction History</h1>
        <div class="history-table-wrapper">
          <table class="history-table">
            <thead>
            <tr>
              <th>Status</th>
              <th>Address</th>
              <th>Time</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item, index) in historyData" :key="index">
              <td>
                <span :class="['status-badge', item.status.toLowerCase()]">{{ item.status }}</span>
              </td>
              <td>{{ item.address }}</td>
              <td>{{ formatDate(item.date) }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  margin: 0;
  padding: 0;
}


.application {
  background: #f8f8f8;
  font-family: 'Roboto', sans-serif;
}

.app__main {
  padding: 16px;
  background: #fff;
  border-radius: 16px 16px 0 0;
}

.app__header {
  border-radius: 0 0 16px 16px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.header__dex-wallet {
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 12px;
  border: none;
  outline: none;
  background: rgba(13, 13, 13, 0.06);
  gap: 8px;
  height: 40px;
  cursor: pointer;
}

.header__dex-wallet:hover .header__dex-address {
  opacity: 1;
}

.header__dex-image {
  border-radius: 100px;
  width: 24px;
  height: 24px;
}

.header__dex-address {
  transition: 0.2s;
  max-width: 85px;
  white-space: nowrap;
  font-size: 14px;
  line-height: 16px;
  opacity: 0.8;
}

.header__info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header__logo {
  width: 44px;
  height: 44px;
}

.header__dex-button {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: 0.2s;
  min-width: 138px;
  padding: 0 10px;
  height: 40px;
  border-radius: 12px;
  background: rgba(13, 13, 13, 0.06);
  border: none;
  outline: none;
  font-size: 13px;
  line-height: normal;
  white-space: nowrap;
  color: #0d0d0d;
}

.header__dex-button:hover {
  background: rgba(13, 13, 13, 0.1);
}

#swap-widget-component {
  margin: 0 auto;
  width: 100%;
  max-width: 450px;
  height: 100vh;
}

.menu-buttons__container {
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-radius: 16px;
  margin: 16px 0;
}

.controls__btn {
  background: rgba(13, 13, 13, 0.06);
  border-radius: 12px;
  white-space: nowrap;
  padding: 0 10px;
  height: 36px;
  transition: 0.2s all;
  border: none;
  outline: none;
  position: relative;
  opacity: 0.6;
}

.controls__btn:hover {
  opacity: 0.8;
}

.controls__btn::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 65%;
  height: 3px;
  background-color: transparent;
  border-radius: 2px 2px 0 0;
  transition: 0.2s;
}

.controls__btn.active::after {
  background-color: #0a84ff;
}

.controls__btn.active:hover {
  opacity: 1;;
}

.btn__text {
  transition: 0.2s;
  font-size: 14px;
}

.active {
  background: rgba(13, 13, 13, 0.06);
  opacity: 1;
}

.active .btn__text {
  opacity: 1;
}

.tma__version {
  font-size: 12px;
  line-height: 14px;
  color: #0d0d0d;
  opacity: 0.5;
}

.disconnect {
  filter: invert(1);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  margin-top: 16px;
}

thead {
  background: none;
}

th {
  text-align: left;
  font-size: 14px;
  color: #0d0d0d;
  opacity: 0.6;
  padding: 8px 12px;
}

tbody tr {
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  transition: background 0.2s;
}

tbody tr:hover {
  background: #eaeaea;
}

td {
  padding: 12px;
  font-size: 14px;
  color: #0d0d0d;
  word-break: break-word;
}

tbody tr td:first-child {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

tbody tr td:last-child {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}


.wallet-icon {
  width: 22px;
  height: 22px;
}

@media screen and (max-width: 600px) {
  #swap-widget-component {
    width: 100%;
  }
}
</style>
