/// <reference types="vitest/config" />
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// O build vai direto para os assets do app Android: o WebView carrega
// http://appassets.androidplatform.net/assets/www/index.html
const androidAssets = fileURLToPath(new URL('../android/app/src/main/assets/www', import.meta.url));

/**
 * Só no `npm run dev`: serve /dev-art/<banner|icon>/<pacote> a partir de web/.dev-art/,
 * as artes oficiais copiadas do Fire TV por scripts/pull-app-art.sh. Fica fora do
 * git e do build: na TV as artes vêm dos próprios apps (AppIconPathHandler.kt).
 */
function devAppArt(): Plugin {
  const dir = fileURLToPath(new URL('./.dev-art', import.meta.url));
  const types: Record<string, string> = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', svg: 'image/svg+xml' };
  return {
    name: 'goular-dev-app-art',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/dev-art', (req, res, next) => {
        const match = /^\/(banner|icon)\/([A-Za-z0-9_.]+)$/.exec(req.url ?? '');
        if (!match) return next();
        for (const ext of Object.keys(types)) {
          const file = `${dir}/${match[1]}/${match[2]}.${ext}`;
          if (existsSync(file)) {
            res.setHeader('Content-Type', types[ext]);
            res.end(readFileSync(file));
            return;
          }
        }
        res.statusCode = 404;
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devAppArt()],
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
