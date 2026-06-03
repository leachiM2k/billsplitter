import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/billsplitter/' : '/';

export default defineConfig({
  base,
  server: {
    allowedHosts: ['.ngrok-free.app'],
  },
  plugins: [react(), tailwindcss()],
})
