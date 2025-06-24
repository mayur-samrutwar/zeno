import { PAYMENT_CONFIG, getPaymentAmount } from '../../config/payment';

export default async function handler(req, res) {
  // This code only runs after successful payment verification by x402 middleware
  const { plan } = req.query;
  
  // Get the payment amount for this plan
  const paymentAmount = getPaymentAmount(plan);
  
  // Generate a random phone number
  const phoneNumber = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  
  // Set expiration based on plan
  const now = new Date();
  const expiresAt = plan === 'temp' 
    ? new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  return res.json({
    phoneNumber,
    expiresAt: expiresAt.toISOString(),
    plan: plan === 'temp' ? 'Quick Pass' : 'Monthly Rental',
    paymentAmount: paymentAmount
  });
} 