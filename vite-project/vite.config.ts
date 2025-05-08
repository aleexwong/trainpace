import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),  
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Train Pace', // Change this to your desired app name
        short_name: 'Train Pace', // Shorter name for display purposes
        description: 'A simple tool to calculate your running pace',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        // icons: [
        //   {
        //     src: '/icons/trainPaceIcon.png', // Ensure these paths exist in your public folder
        //     sizes: '192x192',
        //     type: 'image/png',
        //   },
        //   {
        //     src: '/icons/trainPaceIcon.png',
        //     sizes: '512x512',
        //     type: 'image/png',
        //   },
        // ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})

