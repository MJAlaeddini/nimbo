import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves from /nimbo-site/; the Docker image serves from the root.
  base: process.env.VITE_BASE ?? '/nimbo-site/',
  plugins: [react()],
});
