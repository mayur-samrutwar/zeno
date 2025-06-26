import { isNumberInUse } from '../../lib/sessionStore';

const DEFAULT_NUMBER = '+91 9168163896';

export default function handler(req, res) {
  // If the number is not in use, it's available
  const available = !isNumberInUse(DEFAULT_NUMBER);
  res.status(200).json({ available });
} 