import { logger } from '../config/logger.js';

// Manages persistent application session contexts per external provider
class SourceSessionService {
  constructor() {
    this.sessions = new Map();
  }

  // Returns existing session or creates a new stable session context
  getOrCreateSession(sourceKey) {
    const key = String(sourceKey).toLowerCase();
    const now = new Date();

    if (!this.sessions.has(key)) {
      const newSession = {
        sourceId: key,
        sessionId: `sess_${key}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: now.toISOString(),
        lastUsedAt: now.toISOString(),
        requestCount: 0,
        state: 'ACTIVE',
        lastReason: null,
      };
      this.sessions.set(key, newSession);
      logger.info({ sourceKey, sessionId: newSession.sessionId }, 'Created stable application SourceSession');
    }

    const session = this.sessions.get(key);
    session.lastUsedAt = now.toISOString();
    session.requestCount += 1;
    return session;
  }

  // Updates operational status for target session
  updateSessionState(sourceKey, newState, reason = null) {
    const session = this.getOrCreateSession(sourceKey);
    session.state = newState;
    session.lastReason = reason;
    session.lastUsedAt = new Date().toISOString();
    logger.warn({ sourceKey, sessionId: session.sessionId, newState, reason }, 'Updated SourceSession state');
    return session;
  }

  // Fetches session context by source key
  getSession(sourceKey) {
    const key = String(sourceKey).toLowerCase();
    return this.sessions.get(key) || null;
  }

  // Exports session states across all tracked adapters
  getAllSessions() {
    const result = {};
    const sources = ['greenhouse', 'lever', 'ashby', 'arbeitnow'];
    for (const key of sources) {
      result[key] = this.getOrCreateSession(key);
    }
    return result;
  }

  // Clears stored sessions
  resetSessions() {
    this.sessions.clear();
    logger.info('SourceSession states reset');
  }
}

export const sourceSessionService = new SourceSessionService();
