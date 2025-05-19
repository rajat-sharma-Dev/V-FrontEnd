import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import './WalletConnect.css';

/**
 * Wallet Connection Debug Component - For testing wallet connection
 */
const WalletConnectionDebug = () => {
  const { 
    isConnected, 
    connect, 
    disconnect, 
    account, 
    balance, 
    networkName, 
    connectionError 
  } = useWeb3();
  
  const [log, setLog] = useState([]);
  const [walletType, setWalletType] = useState('coinbase');
  
  const addToLog = (message) => {
    setLog(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };
  
  useEffect(() => {
    if (isConnected) {
      addToLog(`Connected: ${account} on ${networkName}`);
    }
  }, [isConnected, account, networkName]);
  
  useEffect(() => {
    if (connectionError) {
      addToLog(`Error: ${connectionError}`);
    }
  }, [connectionError]);
  
  const handleConnect = async (type) => {
    setWalletType(type);
    addToLog(`Attempting to connect with ${type}...`);
    
    try {
      // Add wallet type to localStorage for future reference
      localStorage.setItem('preferredWallet', type);
      
      await connect(type);
      addToLog('Connect function completed');
    } catch (error) {
      addToLog(`Connection error: ${error.message}`);
    }
  };
  
  const handleDisconnect = () => {
    addToLog('Disconnecting...');
    disconnect();
    localStorage.removeItem('walletConnected');
    addToLog('Disconnected');
  };
  
  const clearLog = () => {
    setLog([]);
  };

  return (
    <div className="wallet-debug-container">
      <h2>Wallet Connection Debugger</h2>
      
      <div className="connection-status">
        <h3>Connection Status</h3>
        <p>
          <strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}
        </p>
        {isConnected && (
          <>
            <p>
              <strong>Account:</strong> {account}
            </p>
            <p>
              <strong>Network:</strong> {networkName}
            </p>
            <p>
              <strong>Balance:</strong> {balance ? `${Number(balance).toFixed(4)} ETH` : '0 ETH'}
            </p>
          </>
        )}
        {connectionError && (
          <p className="error">
            <strong>Error:</strong> {connectionError}
          </p>
        )}
      </div>
      
      <div className="connection-controls">
        <h3>Connect with:</h3>
        <button 
          onClick={() => handleConnect('coinbase')}
          disabled={isConnected}
          className="wallet-debug-button coinbase"
        >
          Coinbase Wallet
        </button>
        <button 
          onClick={() => handleConnect('metamask')}
          disabled={isConnected}
          className="wallet-debug-button metamask"
        >
          MetaMask
        </button>
        <button 
          onClick={handleDisconnect}
          disabled={!isConnected}
          className="wallet-debug-button disconnect"
        >
          Disconnect
        </button>
      </div>
      
      <div className="connection-log">
        <div className="log-header">
          <h3>Connection Log</h3>
          <button onClick={clearLog} className="clear-log-button">Clear Log</button>
        </div>
        <div className="log-content">
          {log.length === 0 ? (
            <p className="no-log">No connection activity yet</p>
          ) : (
            <ul>
              {log.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .wallet-debug-container {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
          max-width: 800px;
          margin: 20px auto;
        }
        
        .connection-status, .connection-controls, .connection-log {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 6px;
          background-color: white;
        }
        
        .connection-log {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .log-content ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .log-content li {
          padding: 5px 0;
          border-bottom: 1px solid #f0f0f0;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .wallet-debug-button {
          padding: 10px 20px;
          margin-right: 10px;
          margin-bottom: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          color: white;
        }
        
        .wallet-debug-button.coinbase {
          background-color: #0052FF;
        }
        
        .wallet-debug-button.metamask {
          background-color: #F6851B;
        }
        
        .wallet-debug-button.disconnect {
          background-color: #e74c3c;
        }
        
        .wallet-debug-button:disabled {
          background-color: #95a5a6;
          cursor: not-allowed;
        }
        
        .clear-log-button {
          padding: 5px 10px;
          background-color: #ddd;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .error {
          color: #e74c3c;
        }
        
        .no-log {
          color: #7f8c8d;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default WalletConnectionDebug;
