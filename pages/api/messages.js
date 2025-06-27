import { getSession } from '../../lib/sessionStore';

// In-memory message store for a single number
const DEFAULT_NUMBER = '+91 9168163896';
const messagesStore = {
  [DEFAULT_NUMBER]: []
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message, timestamp } = req.body;
    // Log incoming message data for debugging
    console.log('[API/messages] Received:', { message, timestamp });
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    messagesStore[DEFAULT_NUMBER].unshift({ message, timestamp: timestamp || new Date().toISOString() });
    return res.status(201).json({ success: true });
  } else if (req.method === 'GET') {
    const { sessionToken } = req.query;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Missing sessionToken' });
    }
    const session = getSession(sessionToken);
    if (!session || !session.active) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    // Only show messages within the session window
    const start = new Date(session.createdAt).getTime();
    const end = new Date(session.expiresAt).getTime();
    const msgs = (messagesStore[DEFAULT_NUMBER] || []).filter(msg => {
      let ts = Number(msg.timestamp);
      if (ts < 1e12) ts = ts * 1000;
      return ts >= start && ts <= end;
    });
    return res.status(200).json({ messages: msgs });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// For MVP, messages are not persisted across server restarts. 