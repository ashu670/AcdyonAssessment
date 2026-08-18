// Single source of truth for runtime configuration and environment variables
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

export const config = {
  port: parseInt(optional('PORT', '3001'), 10),
  databaseUrl: required('DATABASE_URL'),
  nodeEnv: optional('NODE_ENV', 'development'),
  frontendOrigin: optional('FRONTEND_ORIGIN', 'http://localhost:5173'),
  greenhouse: {
    boardToken: optional('GREENHOUSE_BOARD_TOKEN', 'stripe'),
    apiTimeoutMs: parseInt(optional('GREENHOUSE_API_TIMEOUT_MS', '10000'), 10),
  },
  lever: {
    boardToken: optional('LEVER_BOARD_TOKEN', 'spotify'),
    apiTimeoutMs: parseInt(optional('LEVER_API_TIMEOUT_MS', '10000'), 10),
  },
  ashby: {
    boardToken: optional('ASHBY_BOARD_TOKEN', 'linear'),
    apiTimeoutMs: parseInt(optional('ASHBY_API_TIMEOUT_MS', '10000'), 10),
  },
  circuitBreaker: {
    failureThreshold: parseInt(optional('CIRCUIT_BREAKER_THRESHOLD', '3'), 10),
    cooldownMs: parseInt(optional('CIRCUIT_BREAKER_COOLDOWN_MS', '60000'), 10),
  },
};

export const isDev = config.nodeEnv === 'development';
