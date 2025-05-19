import { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getNetwork, saveWalletPreference, getPreferredWallet } from '../utils/ethereum';

// Create Web3 context
export const Web3Context = createContext({
  isConnected: false,
  account: null,
  chainId: null,
  networkName: null,
  provider: null,
  signer: null,
  balance: null,
  connectionError: null,
  connect: (walletType) => {},
  disconnect: () => {},
});

// Web3 Provider Component
export const Web3Provider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const connect = useCallback(async (walletType = 'coinbase') => {
    try {
      setConnectionError(null);
      
      // Save wallet preference
      saveWalletPreference(walletType);
      
      if (!window.ethereum) {
        const error = `${walletType === 'coinbase' ? 'Coinbase Wallet' : 'MetaMask'} not installed. Please install it to continue.`;
        console.error(error);
        setConnectionError(error);
        return;
      }
      
      // Try connecting with our utility
      try {
        const { provider: ethProvider, signer: ethSigner } = await connectWallet(walletType);
        
        setProvider(ethProvider);
        setSigner(ethSigner);
        
        // Get account
        const address = await ethSigner.getAddress();
        setAccount(address);
        
        // Get network
        const network = await getNetwork(ethProvider);
        setChainId(network.chainId);
        setNetworkName(network.name);
        
        // Get balance
        try {
          const bal = await ethProvider.getBalance(address);
          setBalance(ethers.formatEther(bal));
        } catch (balanceError) {
          console.error('Error getting balance:', balanceError);
          setBalance('0');
        }
        
        setIsConnected(true);
      } catch (mainError) {
        console.error('Error with primary connection method:', mainError);
        
        // Direct fallback if the main connection fails
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            
            // Try to get chain ID directly
            try {
              const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
              const chainId = parseInt(chainIdHex, 16);
              setChainId(chainId);
              setNetworkName(getNetworkNameFromChainId(chainId));
            } catch (chainError) {
              console.error('Error getting chain ID:', chainError);
            }
            
            setIsConnected(true);
          } else {
            throw new Error('No accounts found');
          }
        } catch (fallbackError) {
          console.error('Fallback connection failed:', fallbackError);
          throw mainError; // Re-throw the original error
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnectionError(error.message || 'Failed to connect wallet');
      setIsConnected(false);
    }
  }, []);
  
  // Network name helper function
  const getNetworkNameFromChainId = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      42161: 'Arbitrum One',
      43114: 'Avalanche C-Chain',
      56: 'Binance Smart Chain',
      84532: 'Base Sepolia',
      8453: 'Base',
    };
    
    return networks[chainId] || `Chain ID ${chainId}`;
  };

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
    setNetworkName(null);
    setProvider(null);
    setSigner(null);
    setBalance(null);
    setConnectionError(null);
    
    // Clear connection state from localStorage
    localStorage.removeItem('walletConnected');
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          connect(); // Refresh connection with new account
        }
      };

      const handleChainChanged = () => {
        window.location.reload(); // Recommended by MetaMask
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, connect, disconnect]);

  // Save connection state to localStorage
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('walletConnected', 'true');
    } else {
      localStorage.removeItem('walletConnected');
    }
  }, [isConnected]);
  
  // Automatically try to connect on component mount
  useEffect(() => {
    const autoConnect = async () => {
      // Check if wallet was previously connected
      const hasConnectedBefore = localStorage.getItem('walletConnected') === 'true';
      const preferredWallet = getPreferredWallet();
      
      if (window.ethereum && (window.ethereum.selectedAddress || hasConnectedBefore)) {
        try {
          await connect(preferredWallet);
        } catch (error) {
          console.error("Auto-connect failed:", error);
          // Clear local storage if auto-connect fails
          localStorage.removeItem('walletConnected');
        }
      }
    };
    
    autoConnect();
  }, [connect]);

  const contextValue = {
    isConnected,
    account,
    chainId,
    networkName,
    provider,
    signer,
    balance,
    connectionError,
    connect,
    disconnect,
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};
