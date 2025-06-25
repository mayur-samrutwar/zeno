// Simple in-memory session store for MVP
// In production, replace with a persistent database

const sessions = {};

export function createSession(session) {
  sessions[session.sessionId] = session;
}

export function getSession(sessionId) {
  return sessions[sessionId];
}

export function updateSession(sessionId, updates) {
  if (sessions[sessionId]) {
    sessions[sessionId] = { ...sessions[sessionId], ...updates };
  }
}

export function deleteSession(sessionId) {
  delete sessions[sessionId];
}

export function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of Object.entries(sessions)) {
    if (new Date(session.expiresAt).getTime() < now) {
      delete sessions[sessionId];
    }
  }
} 