import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`        → carpeta dist/ (web estática normal)
// `npm run build:single` → dist/index.html autocontenido (se abre con doble clic)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: { chunkSizeWarningLimit: 2000, target: 'es2020' },
}));
