import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { config } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';

import ingestionRoutes from './routes/ingestion.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import sourcesRoutes from './routes/sources.routes.js';
import sandboxRoutes from './routes/sandbox.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration for local development and production Vercel origins
const rawOrigins = (config.frontendOrigin || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    ...rawOrigins,
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        // Refuse CORS without throwing exception that breaks Express error pipeline
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'acdyon-assessment',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/sandbox', sandboxRoutes);

// Fallback 404 handler for unmapped routes
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

// Global error handler
app.use(errorMiddleware);

export default app;
