import pino from 'pino';
import { isDev } from './env.js';

// In development, use pino-pretty for human-readable logs.
// In production, emit plain JSON for log aggregators (Datadog, etc).
const transport = isDev
  ? { target: 'pino-pretty', options: { colorize: true } }
  : undefined;

export const logger = pino({ level: 'info', transport });
