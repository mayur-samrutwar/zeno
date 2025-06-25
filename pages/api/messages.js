// In-memory message store: { [phoneNumber]: [ { message, timestamp } ] }
const messagesStore = {};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { phoneNumber, message, timestamp } = req.body;
    // Log incoming message data for debugging
    console.log('[API/messages] Received:',  req.body );
    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'phoneNumber and message are required' });
    }
    if (!messagesStore[phoneNumber]) {
      messagesStore[phoneNumber] = [];
    }
    messagesStore[phoneNumber].unshift({ message, timestamp: timestamp || new Date().toISOString() });
    return res.status(201).json({ success: true });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// For MVP, messages are not persisted across server restarts. 