import { PAYMENT_CONFIG, getPaymentAmount } from '../../config/payment';
import { createSession, isNumberInUse } from '../../lib/sessionStore';
import crypto from 'crypto';

const DEFAULT_NUMBER = '+91 9168163896';

export default async function handler(req, res) {
  // This code only runs after successful payment verification by x402 middleware
  const { plan } = req.query;
  
  // Only allow 'temp' plan for the single number
  if (plan !== 'temp') {
    return res.status(400).json({ error: 'No numbers available for this plan' });
  }

  // Check if the number is already in use
  if (isNumberInUse(DEFAULT_NUMBER)) {
    return res.status(409).json({ error: 'No numbers available. Please try again later.' });
  }

  // Get the payment amount for this plan
  const paymentAmount = getPaymentAmount(plan);
  
  // Set expiration based on plan
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  // Generate a session token (sessionId)
  const sessionId = crypto.randomUUID();

  // Create and store the session
  createSession({
    sessionId,
    phoneNumber: DEFAULT_NUMBER,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    active: true,
    plan: 'Quick Pass',
    paymentAmount
  });

  return res.json({
    phoneNumber: DEFAULT_NUMBER,
    expiresAt: expiresAt.toISOString(),
    plan: 'Quick Pass',
    paymentAmount: paymentAmount,
    sessionToken: sessionId
  });
} 