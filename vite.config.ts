import { defineConfig } from 'vitest/config';
export default defineConfig({
  base: './',
  test: { include: ['tests/*.test.ts'], environment: 'node' },
  build: { rollupOptions: { output: { manualChunks: id => id.includes('/node_modules/phaser/') ? 'phaser' : undefined } } },
});
