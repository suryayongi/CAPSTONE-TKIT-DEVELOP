import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const localApiPlugin = () => ({
  name: 'duniamadani-local-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) {
        return next();
      }

      const routeName = req.url.split('?')[0].replace(/^\/api\//, '').replace(/\/+$/, '');
      if (!routeName || routeName.startsWith('_') || routeName.includes('..')) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Endpoint tidak ditemukan' }));
        return;
      }

      const apiFile = path.resolve(process.cwd(), 'api', `${routeName}.js`);
      if (!fs.existsSync(apiFile)) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Endpoint tidak ditemukan' }));
        return;
      }

      try {
        const mod = await import(pathToFileURL(apiFile).href);
        await mod.default(req, res);
      } catch (err) {
        console.error('[localApiPlugin error]', err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err.message || 'Server error' }));
        }
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Muat .env dan .env.local agar DATABASE_URL tersedia saat testing npm run dev lokal
  const env = loadEnv(mode, process.cwd(), '');
  if (env.DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  }
  if (env.AUTH_SECRET && !process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = env.AUTH_SECRET;
  }

  return {
    plugins: [react(), localApiPlugin()]
  };
});
