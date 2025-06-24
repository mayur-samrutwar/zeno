import { useState, useEffect } from 'react';
import { Mail, RefreshCw, ArrowLeft, ShieldCheck, Calendar, Copy, Check, Wallet } from 'lucide-react';
import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';

export default function Home() {
  const [step, setStep] = useState('options'); // 'options', 'payment', 'otp'
  const [option, setOption] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [walletClient, setWalletClient] = useState(null);
  const [account, setAccount] = useState(null);
  const [phoneData, setPhoneData] = useState(null);

  const initialMessages = [
    { id: 1, sender: 'Google', text: 'Your verification code is 812934', time: '2m ago', isNew: true },
    { id: 2, sender: 'Discord', text: 'Your 6-digit code is 302551. It expires in 10 minutes.', time: '5m ago', isNew: false },
    { id: 3, sender: 'Amazon', text: 'To authenticate, please use the following One Time Password (OTP): 684332', time: '1h ago', isNew: false },
  ];

  const [messages, setMessages] = useState(initialMessages);

  // Generate a random phone number
  const phoneNumber = '+1 (555) 123-4567';

  const handleOptionClick = (selectedOption) => {
    setOption(selectedOption);
    setStep('payment');
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (typeof window.ethereum !== 'undefined') {
        // First get the address from ethereum provider
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!address) {
          throw new Error('No address received from wallet');
        }
        
        // Create wallet client with the account hoisted
        const client = createWalletClient({
          account: address,
          chain: baseSepolia,
          transport: custom(window.ethereum)
        });
        
        console.log('Connected wallet:', address);
        
        setWalletClient(client);
        setAccount({ address });
        setIsConnecting(false);
      } else {
        alert('Please install MetaMask or another wallet');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
      setIsConnecting(false);
    }
  };

  const handlePayment = async () => {
    if (!account || !account.address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!walletClient) {
      alert('Wallet client not available');
      return;
    }

    console.log('Making payment with account:', account);
    console.log('Wallet client:', walletClient);

    setIsPaying(true);
    try {
      // Use the wallet client directly - it already has the account hoisted
      const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);
      
      console.log('Making request to:', `/api/phone-number?plan=${option}`);
      
      const response = await fetchWithPayment(`/api/phone-number?plan=${option}`, {
        method: 'GET',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        setPhoneData(data);
        setStep('otp');
        
        // Decode payment response for logging - with error handling
        const paymentResponseHeader = response.headers.get('x-payment-response');
        if (paymentResponseHeader) {
          try {
            const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
            console.log('Payment successful:', paymentResponse);
          } catch (decodeError) {
            console.warn('Could not decode payment response header:', decodeError);
            console.log('Raw payment response header:', paymentResponseHeader);
          }
        } else {
          console.log('No x-payment-response header found');
        }
      } else {
        // Log the error response
        const errorText = await response.text();
        console.error('Payment failed with status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(`Payment failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('Payment failed. Please try again. Error: ' + error.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleBack = () => {
    setStep('options');
  };

  const handleCopyNumber = async () => {
    if (!phoneData?.phoneNumber) return;
    
    try {
      await navigator.clipboard.writeText(phoneData.phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate fetching new messages
    setTimeout(() => {
      const newMessage = {
        id: messages.length + 1,
        sender: 'Telegram',
        text: `Your login code is ${Math.floor(100000 + Math.random() * 900000)}.`,
        time: '1s ago',
        isNew: true,
      };
      setMessages(prev => [newMessage, ...prev.map(m => ({ ...m, isNew: false }))]);
      setIsRefreshing(false);
    }, 1500);
  };
  
  useEffect(() => {
    if (step === 'otp') {
      const interval = setInterval(() => {
        handleRefresh();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Debug account state changes
  useEffect(() => {
    console.log('Account state changed:', account);
  }, [account]);

  const OptionCard = ({ title, description, price, icon, onClick }) => (
    <button
      onClick={onClick}
      className="group w-full sm:w-1/2 bg-white/80 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl p-6 flex flex-col items-center hover:shadow-2xl hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
    >
      <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-blue-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1 text-center">{title}</h3>
      <p className="text-sm text-slate-500 mb-4 text-center">{description}</p>
      <span className="mt-auto text-xl font-bold text-slate-900 text-center w-full block">{price}</span>
    </button>
  );

  const renderOptions = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 text-center mb-2">Get a Private Number</h1>
      <p className="text-slate-500 text-center mb-8">Choose a plan to start receiving secure messages.</p>
      <div className="flex flex-col sm:flex-row gap-6">
        <OptionCard
          title="Quick Pass"
          description="Temporary number for 10 minutes. Ideal for one-time verifications."
          price="$5"
          icon={<ShieldCheck size={28} />}
          onClick={() => handleOptionClick('temp')}
        />
        <OptionCard
          title="Monthly Rental"
          description="Dedicated number for a month. Unlimited messages."
          price="$25"
          icon={<Calendar size={28} />}
          onClick={() => handleOptionClick('rent')}
        />
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="flex flex-col items-center justify-center min-h-[350px]">
      <button onClick={handleBack} className="absolute top-6 left-6 text-slate-400 hover:text-blue-600 transition-colors">
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Complete Payment</h1>
      <p className="text-center text-slate-500 mb-6">
        You selected <span className="font-semibold text-slate-800">{option === 'temp' ? 'Quick Pass' : 'Monthly Rental'}</span>.
      </p>
      
      {!account || !account.address ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full max-w-xs py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-lg flex items-center justify-center gap-2"
        >
          <Wallet size={20} />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="w-full max-w-xs space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-sm text-slate-500">Connected Wallet</p>
            <p className="text-xs font-mono text-slate-700 truncate">{account.address}</p>
            <p className="text-xs text-slate-400 mt-1">Ready to pay</p>
          </div>
          <button
            onClick={handlePayment}
            disabled={isPaying}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-lg"
          >
            {isPaying ? 'Processing Payment...' : `Pay ${option === 'temp' ? '$5' : '$25'} with USDT`}
          </button>
        </div>
      )}
    </div>
  );

  const renderOtpDisplay = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* Phone Number Display */}
      <div className="bg-slate-50/50 rounded-xl p-4 mb-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Your assigned number:</p>
            <p className="text-lg font-bold text-slate-800 font-mono">{phoneData?.phoneNumber || 'Loading...'}</p>
            {phoneData?.expiresAt && (
              <p className="text-xs text-slate-400 mt-1">
                Expires: {new Date(phoneData.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={handleCopyNumber}
            disabled={!phoneData?.phoneNumber}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Inbox</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 shadow rounded-full text-slate-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-wait transition-all"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>
      <div className="divide-y divide-slate-200 bg-transparent">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 pt-16">
            <Mail size={48} className="mx-auto" />
            <p className="mt-4">Waiting for messages...</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start py-5 px-2 sm:px-4 bg-transparent transition-all duration-300 ${msg.isNew ? 'bg-blue-50/40' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600 mr-4 text-base mt-1">
              {msg.sender.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <span className="font-bold text-slate-700 truncate mr-2">{msg.sender}</span>
                <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{msg.time}</span>
                {msg.isNew && (
                  <span className="ml-2 text-xs font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">New</span>
                )}
              </div>
              <span className="block text-slate-800 font-mono text-lg tracking-wider break-words">
                {msg.text.replace(/(\d{6})/, (m) => m)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans p-4">
      <div className="relative bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-3xl w-full max-w-3xl p-8 sm:p-12 transition-all duration-300 flex flex-col items-center justify-center">
        {step === 'options' && renderOptions()}
        {step === 'payment' && renderPayment()}
        {step === 'otp' && renderOtpDisplay()}
      </div>
    </div>
  );
}
