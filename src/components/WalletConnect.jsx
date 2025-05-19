// filepath: /Users/shubhtastic/Documents/cyfrin_web3/V-FrontEnd/src/components/WalletConnect.jsx
import { useWeb3 } from '../hooks/useWeb3';
import { useState, useEffect } from 'react';
import { getPreferredWallet } from '../utils/ethereum';
import './WalletConnect.css'; 

/**
 * Wallet Connect Button Component
 */
const WalletConnect = () => {
  const { isConnected, connect, disconnect, account, balance, networkName, connectionError } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [currentWalletType, setCurrentWalletType] = useState(getPreferredWallet());
  
  // Reset connecting state when connection status changes
  useEffect(() => {
    if (isConnected) {
      setIsConnecting(false);
    }
    
    // Set a timeout to reset connecting state if it takes too long
    let timeout;
    if (isConnecting) {
      timeout = setTimeout(() => {
        setIsConnecting(false);
      }, 15000); // 15 seconds timeout
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isConnected, isConnecting]);
  
  // Set current wallet type from localStorage on mount
  useEffect(() => {
    setCurrentWalletType(getPreferredWallet());
  }, []);
  
  const handleConnect = async (walletType = 'coinbase') => {
    setIsConnecting(true);
    setShowDropdown(false);
    setCurrentWalletType(walletType);
    
    try {
      await connect(walletType);
      // Connection successful, the useEffect will handle resetting isConnecting
    } catch (error) {
      console.error("Connection error:", error);
      // Reset connecting state immediately for errors
      setIsConnecting(false);
      // Error will be shown via connectionError from context
    }
  };
  
  const handleWalletButtonClick = () => {
    if (isConnected) {
      setShowWalletInfo(!showWalletInfo);
    } else if (!isConnecting) {
      setShowDropdown(!showDropdown);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
      setShowWalletInfo(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Prevent close when clicking inside
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="wallet-connect-container" onClick={handleContainerClick}>
      {connectionError && (
        <div className="wallet-error">
          <span className="error-icon">⚠️</span> {connectionError}
          <button className="retry-button" onClick={() => handleConnect(currentWalletType)}>
            Try Again
          </button>
        </div>
      )}
      
      {isConnected ? (
        <>
          <button 
            className="wallet-button connected"
            onClick={handleWalletButtonClick}
          >
            <span className="network-badge">{networkName}</span>
            <span className={`wallet-icon ${currentWalletType}`}></span>
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
          </button>
          
          {showWalletInfo && (
            <div className="wallet-dropdown">
              <div className="wallet-info">
                <p>
                  <strong>Account:</strong> {account}
                </p>
                <p>
                  <strong>Network:</strong> {networkName}
                </p>
                <p>
                  <strong>Balance:</strong> <span className="balance">{balance ? `${Number(balance).toFixed(4)} ETH` : '0 ETH'}</span>
                </p>
                <div className={`wallet-type ${currentWalletType}`}>
                  {currentWalletType === 'coinbase' ? 'Coinbase Wallet' : 'MetaMask'}
                </div>
              </div>
              <button className="disconnect-button" onClick={disconnect}>
                Disconnect Wallet
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <button 
            className="wallet-button"
            onClick={handleWalletButtonClick}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="connecting-animation"></span>
                Connecting...
              </>
            ) : 'Connect Wallet'}
          </button>
          
          {showDropdown && !isConnecting && (
            <div className="wallet-dropdown">
              <button 
                className="wallet-option coinbase" 
                onClick={() => handleConnect('coinbase')}
              >
                Coinbase Wallet (Recommended)
              </button>
              <button 
                className="wallet-option metamask" 
                onClick={() => handleConnect('metamask')}
              >
                MetaMask
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WalletConnect;
