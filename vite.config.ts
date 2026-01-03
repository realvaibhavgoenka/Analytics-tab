import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This must match your repository name for GitHub Pages to find assets
  base: '/Analytics-tab/', 
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  }
});