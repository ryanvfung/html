import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { pyrocarbon: resolve(import.meta.dirname, 'src/js/pyrocarbon.js') },
      output: { entryFileNames: '[name].js', chunkFileNames: '[name].js', assetFileNames: 'pyrocarbon.[ext]' },
    },
  },
});
