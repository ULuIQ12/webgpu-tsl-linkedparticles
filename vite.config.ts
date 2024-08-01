import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

const fullReloadAlways: PluginOption = {
  name: 'full-reload-always',
  handleHotUpdate({ server }) {
    server.ws.send({ type: "full-reload" })
    return []
  },
} as PluginOption

// https://vitejs.dev/config/
export default defineConfig({
  base: 'https://ulucode.com/random/webgputests/linked/',
  plugins: [
    react(),
    fullReloadAlways
  ],
  build: {
    target: 'esnext' //browsers can handle the latest ES features
  },
  esbuild: {
    supported: {
      'top-level-await': true //browsers can handle top-level-await features
    },
  },
  optimizeDeps: {
    exclude: ['three'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  
})
