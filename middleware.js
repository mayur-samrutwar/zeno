import { paymentMiddleware } from 'x402-next';

// Configure the payment middleware
export const middleware = paymentMiddleware(
  "0xAF58823a02d830a8C253Ee10e2C00Bc3793444Ce", // your receiving wallet address 
  {  // Route configurations for protected endpoints
    '/api/phone-number': {
      price: '$0.01', // Fixed price for testing - $0.01 USDC
      network: "base", // Base Sepolia testnet
      config: {
        description: 'Access to temporary phone number service',
        maxTimeoutSeconds: 300
      }
    },
  },
  {
    url: "https://x402.org/facilitator", // Use public facilitator for Base Sepolia testnet
  }
);

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/phone-number',
  ]
}; 