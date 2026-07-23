import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // sockjs-client (used by the live-chat WebSocket client) expects Node's
  // `global` to exist; the browser doesn't have one.
  define: {
    global: "globalThis",
  },
})