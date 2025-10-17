import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fragmentInjector from "./vite.plugin.fragment-injector";

// https://vite.dev/config/
export default defineConfig({
  plugins: [fragmentInjector(),react()],
    base: '/test-app/',   // 👈 very important for GitHub Pages
})
