/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O build vai direto para os assets do app Android: o WebView carrega
// http://appassets.androidplatform.net/assets/www/index.html
const androidAssets = fileURLToPath(new URL('../android/app/src/main/assets/www', import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: androidAssets,
    emptyOutDir: true,
    // WebView de Fire OS 7 pode ser antigo: mantenha a saída compatível com Chromium 87+.
    target: 'chrome87',
    cssTarget: 'chrome87',
  },
  server: { port: 5173, host: true },
  test: { environment: 'node' },
});
