import { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getNetwork } from '../utils/ethereum';

// Create Web3 context
export const Web3Context = createContext({
  isConnected: false,
  account: null,
  chainId: null,
  networkName: null,
  provider: null,
  signer: null,
  balance: null,
  connect: () => {},
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

  const connect = useCallback(async () => {
    try {
      const { provider: ethProvider, signer: ethSigner } = await connectWallet();
      
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
      const bal = await ethProvider.getBalance(address);
      setBalance(ethers.formatEther(bal));
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
    setNetworkName(null);
    setProvider(null);
    setSigner(null);
    setBalance(null);
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

  // Automatically try to connect on component mount
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        await connect();
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
    connect,
    disconnect,
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};
