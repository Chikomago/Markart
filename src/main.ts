import { createApp } from 'vue'
import App from './App.vue'
import { installI18n } from './i18n'
import './style.css'
import { installDesktopKeyboardPolicy } from './workspace/desktopKeyboard'

const removeKeyboardPolicy = installDesktopKeyboardPolicy()
if (import.meta.hot) import.meta.hot.dispose(removeKeyboardPolicy)

const app = createApp(App)
installI18n(app)
app.mount('#app')
