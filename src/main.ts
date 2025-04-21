import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

import MateChat from '@matechat/core';

import '@devui-design/icons/icomoon/devui-icon.css';

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(MateChat)
app.mount('#app')
