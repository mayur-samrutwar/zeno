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
  const [phoneData, setPhoneData] = useState({ phoneNumber: '+91 9168163896' });
  const [timeLeft, setTimeLeft] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  const [messages, setMessages] = useState([]);

  const DEFAULT_NUMBER = '+91 9168163896';

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
        setSessionToken(data.sessionToken);
        localStorage.setItem('phoneData', JSON.stringify(data));
        localStorage.setItem('sessionToken', data.sessionToken);
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

  // Debug account state changes
  useEffect(() => {
    console.log('Account state changed:', account);
  }, [account]);

  // Update timer when phoneData changes
  useEffect(() => {
    if (phoneData?.expiresAt && step === 'otp') {
      const expiry = new Date(phoneData.expiresAt).getTime();
      const update = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diff);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [phoneData, step]);

  // Format seconds as MM:SS
  function formatTimeLeft(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const OptionCard = ({ title, description, price, icon, onClick }) => (
    <button
      onClick={onClick}
      className="group w-80 bg-purple-50 border-8 border-white shadow-lg rounded-2xl p-6 flex flex-col items-center hover:shadow-2xl  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
    >
      <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-xl bg-white text-purple-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1 text-center">{title}</h3>
      <p className="text-sm text-slate-500 mb-4 text-center">{description}</p>
      <span className="mt-auto text-xl font-bold text-slate-900 text-center w-full block">{price}</span>
    </button>
  );

  const renderOptions = () => (
    <div>
      <div className="flex flex-col sm:flex-row gap-6">
        <OptionCard
          title="Quick Pass"
          description="Validity: 10 minutes"
          price="1 USDC"
          icon={<ShieldCheck size={28} />}
          onClick={() => handleOptionClick('temp')}
        />
        <OptionCard
          title="Monthly Rental"
          description="Validity: 30 days"
          price="25 USDC"
          icon={<Calendar size={28} />}
          onClick={() => handleOptionClick('rent')}
        />
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="flex flex-col items-center justify-center min-h-[350px]">
      <button onClick={handleBack} className="absolute top-6 left-6 text-black hover:text-blue-600 transition-colors">
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
          {/* <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-sm text-slate-500">Connected Wallet</p>
            <p className="text-xs font-mono text-slate-700 truncate">{account.address}</p>
            <p className="text-xs text-slate-400 mt-1">Ready to pay</p>
          </div> */}
          <button
            onClick={handlePayment}
            disabled={isPaying}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-lg"
          >
            {isPaying ? 'Processing Payment...' : `Pay ${option === 'temp' ? '1 USDC' : '25 USDC'}`}
          </button>
        </div>
      )}
    </div>
  );

  const renderOtpDisplay = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* Logout Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 transition-all"
        >
          Logout
        </button>
      </div>
      {/* Phone Number Display */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Your assigned number:</p>
            <p className="text-lg font-bold text-slate-800 font-mono">{DEFAULT_NUMBER}</p>
            {phoneData?.expiresAt && (
              <p className="text-xs text-slate-400 mt-1">
                Expires: {new Date(phoneData.expiresAt).toLocaleString()}
                {typeof timeLeft === 'number' && (
                  <span className={`ml-2 px-2 py-0.5 rounded font-mono text-xs font-semibold ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                    {timeLeft > 0 ? `Time left: ${formatTimeLeft(timeLeft)}` : 'Session expired'}
                  </span>
                )}
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

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedPhoneData = localStorage.getItem('phoneData');
    const storedSessionToken = localStorage.getItem('sessionToken');
    if (storedPhoneData && storedSessionToken) {
      try {
        const parsed = JSON.parse(storedPhoneData);
        // Check if session is still valid (not expired)
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() > Date.now()) {
          setPhoneData(parsed);
          setSessionToken(storedSessionToken);
          setStep('otp');
        } else {
          // Expired, clear storage
          localStorage.removeItem('phoneData');
          localStorage.removeItem('sessionToken');
        }
      } catch (e) {
        localStorage.removeItem('phoneData');
        localStorage.removeItem('sessionToken');
      }
    }
  }, []);

  // Clear session from localStorage when session expires
  useEffect(() => {
    if (typeof timeLeft === 'number' && timeLeft === 0) {
      localStorage.removeItem('phoneData');
      localStorage.removeItem('sessionToken');
    }
  }, [timeLeft]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('phoneData');
    localStorage.removeItem('sessionToken');
    setPhoneData(null);
    setSessionToken(null);
    setStep('options');
  };

  // Add a placeholder refresh handler for now
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          (data.messages || []).map((msg, idx) => ({
            id: idx + 1,
            sender: 'SMS',
            text: msg.message,
            time: formatTimeAgo(msg.timestamp),
            isNew: idx === 0,
          }))
        );
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
    setIsRefreshing(false);
  };

  // Helper to format time ago
  function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleString();
  }

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center font-sans p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 text-center mb-2">Zeno: Get a Temporary Private Number</h1>
        <p className="text-slate-500 text-center mb-8">Choose a plan to start receiving secure messages.</p>
      </div>
      <div className="w-full max-w-3xl">
        <div className="bg-purple-100 relative border-4 border-dashed border-purple-300 rounded-3xl w-full p-8 sm:p-12 transition-all duration-300 flex flex-col items-center justify-center">
          {step === 'options' && renderOptions()}
          {step === 'payment' && renderPayment()}
          {step === 'otp' && renderOtpDisplay()}
        </div>
      </div>
    </div>
  );
}
