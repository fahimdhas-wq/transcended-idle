import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  base: '/transcended-idle/',
  plugins: [svelte()],
  resolve: {
    conditions: ['browser', 'svelte']
  }
})
