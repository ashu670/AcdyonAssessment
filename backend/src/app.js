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

// CORS configuration for local development origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  config.frontendOrigin
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

// Body parser
app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
