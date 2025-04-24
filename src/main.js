import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import WebApp from '@twa-dev/sdk';
WebApp.ready();

let a = createApp(App);
a.mount('#app');