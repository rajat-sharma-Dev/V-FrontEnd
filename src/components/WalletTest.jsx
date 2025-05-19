import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletTest = () => {
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [connectionTimeout, setConnectionTimeout] = useState(null);
  
  // Clear connection state after timeout
  useEffect(() => {
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [connectionTimeout]);
  
  const connectWallet = async () => {
    try {
      setError('');
      setConnecting(true);
      
      // Set a timeout to reset connecting state if it takes too long
      const timeout = setTimeout(() => {
        setConnecting(false);
        setError('Connection attempt timed out. Please try again.');
      }, 15000); // 15 seconds timeout
      
      setConnectionTimeout(timeout);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install it to use this app.');
        setConnecting(false);
        clearTimeout(timeout);
        return;
      }
      
      console.log('Requesting accounts...');
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts received:', accounts);
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        
        // Try to get chain ID
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(parseInt(chainIdHex, 16));
        } catch (chainError) {
          console.error('Error getting chain ID:', chainError);
        }
        
      } else {
        setError('No accounts found.');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(`Error connecting wallet: ${err.message}`);
    } finally {
      // Make sure connecting state is reset
      setConnecting(false);
      clearTimeout(connectionTimeout);
    }
  };
  
  // A more advanced connection using ethers
  const connectWithEthers = async () => {
    try {
      setError('');
      setConnecting(true);
      
      // Set a timeout to reset connecting state if it takes too long
      const timeout = setTimeout(() => {
        setConnecting(false);
        setError('Connection attempt timed out. Please try again.');
      }, 15000); // 15 seconds timeout
      
      setConnectionTimeout(timeout);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install it to use this app.');
        setConnecting(false);
        clearTimeout(timeout);
        return;
      }
      
      console.log('Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        setError('No accounts found.');
        setConnecting(false);
        return;
      }
      
      console.log('Creating provider...');
      try {
        // Try with BrowserProvider (ethers v6)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
        
        console.log('Connected with ethers v6 BrowserProvider');
      } catch (providerError) {
        console.error('Error with BrowserProvider:', providerError);
        setError(`Provider error: ${providerError.message}`);
      }
    } catch (err) {
      console.error('Error connecting with ethers:', err);
      setError(`Connection error: ${err.message}`);
    } finally {
      // Ensure connecting state is reset
      setConnecting(false);
      clearTimeout(connectionTimeout);
    }
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', margin: '20px' }}>
      <h2>Wallet Connection Test</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {account ? (
        <div>
          <p><strong>Connected Account:</strong> {account}</p>
          {chainId && <p><strong>Chain ID:</strong> {chainId}</p>}
          <button 
            onClick={() => {
              setAccount('');
              setChainId(null);
            }}
            style={{ background: '#f44336', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={connectWallet}
            disabled={connecting}
            style={{ background: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: connecting ? 'not-allowed' : 'pointer' }}
          >
            {connecting ? 'Connecting...' : 'Connect (Simple)'}
          </button>
          
          <button 
            onClick={connectWithEthers}
            disabled={connecting}
            style={{ background: '#2196F3', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: connecting ? 'not-allowed' : 'pointer' }}
          >
            {connecting ? 'Connecting...' : 'Connect (with ethers)'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletTest;
