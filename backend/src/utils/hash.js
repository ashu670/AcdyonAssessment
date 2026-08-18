import crypto from 'crypto';

// Computes deterministic SHA-256 hex digest for content change detection
export function computeHash(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
