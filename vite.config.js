import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'CropAnnotate',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'crop-annotate.js';
        if (format === 'cjs') return 'crop-annotate.cjs';
        if (format === 'umd') return 'crop-annotate.min.js';
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  }
});
