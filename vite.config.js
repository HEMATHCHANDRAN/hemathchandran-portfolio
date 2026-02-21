import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import path from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  plugins: [glsl()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});