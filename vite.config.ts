import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({ plugins: [vue()], worker: { format: 'es' }, server: { host: '127.0.0.1', port: 5173, strictPort: true }, build: { rollupOptions: { input: { main: resolve(__dirname, 'index.html') } } } })
