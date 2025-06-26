import { updateSession } from '../../lib/sessionStore';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { sessionToken } = req.body;
  if (!sessionToken) return res.status(400).json({ error: 'Missing sessionToken' });
  updateSession(sessionToken, { active: false });
  res.status(200).json({ success: true });
} 