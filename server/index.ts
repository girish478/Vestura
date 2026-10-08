import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { tryOnRouter } from './routes/tryOn.js';
import { getSystemHealthStatus } from './ai/provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function start() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));
  app.use('/api', tryOnRouter);

  if (isProduction) {
    const dist = path.join(root, 'dist');
    app.use(express.static(dist));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      root,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, async () => {
    console.log(`\n  Virtual AI Try-On`);
    console.log(`  ──────────────────────────────────────────────`);
    console.log(`  App URL:    http://localhost:${port}`);
    console.log(`  Environment: ${isProduction ? 'production' : 'development'}`);

    const health = await getSystemHealthStatus();
    console.log(`  Mode 1 (Local):  ${health.local.configured ? '🟢 Ready (' + health.local.details?.url + ')' : '⚪ Available (requires GPU server)'}`);
    console.log(`  Mode 2 (Cloud):  ${health.cloud.configured ? '☁️  Ready (Gemini API)' : '⚠️  Needs API key or user input'}`);
    console.log(`  ──────────────────────────────────────────────\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
