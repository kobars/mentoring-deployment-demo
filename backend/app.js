// Membuat Express app tanpa menjalankan server. server.js yang memanggil listen.
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { HttpError } from './utils/HttpError.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authLimiter } from './middlewares/rateLimit.js';
import { db } from './db/connection.js';
import openapi from './docs/openapi.json' with { type: 'json' };

const app = express();

// Caddy berada di depan app. Percayai satu proxy agar req.ip berisi IP pengguna, bukan IP Caddy.
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    // Saat VPS masih memakai http://IP, browser tidak boleh dipaksa ke https.
    directives: { upgradeInsecureRequests: null }
  }
}));
app.use(express.json({ limit: '100kb' }));

// /health: proses HTTP hidup. /health/ready: database juga bisa dihubungi.
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok' });
  } catch (error) {
    console.error('[health] database:', error.code ?? error.message);
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

app.get('/api-docs/openapi.json', (req, res) => res.json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: 'Product API — Mentoring Deploy Demo',
  swaggerOptions: { validatorUrl: null }
}));

// Response API berisi data per pengguna. Jangan disimpan oleh cache mana pun (termasuk CDN Vercel).
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);

// Untuk development lokal: backend juga melayani folder frontend.
app.use(express.static(fileURLToPath(new URL('../frontend/', import.meta.url))));
app.use((req, res, next) => next(new HttpError(404, 'Endpoint tidak ditemukan.')));
app.use(errorHandler);

export default app;
