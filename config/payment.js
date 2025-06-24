// Payment configuration for x402 integration
export const PAYMENT_CONFIG = {
  // Your wallet address where payments will be sent
  RECIPIENT_ADDRESS: '0xAF58823a02d830a8C253Ee10e2C00Bc3793444Ce', // Replace with your actual address
  
  // Payment amounts in USDC (6 decimals)
  AMOUNTS: {
    QUICK_PASS: '100000', // $5 USDC = 5,000,000 wei
    MONTHLY_RENTAL: '25000000', // $25 USDC = 25,000,000 wei
  },
  
  // Currency (default is USDC)
  CURRENCY: 'USDC',
  
  // Network configuration
  NETWORK: 'base-sepolia', // Base Sepolia testnet
  
  // Payment timeout
  TIMEOUT_SECONDS: 300, // 5 minutes
};

// Helper function to get amount based on plan
export const getPaymentAmount = (plan) => {
  return plan === 'temp' ? PAYMENT_CONFIG.AMOUNTS.QUICK_PASS : PAYMENT_CONFIG.AMOUNTS.MONTHLY_RENTAL;
}; 