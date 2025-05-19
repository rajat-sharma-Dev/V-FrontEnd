import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import './WalletConnectionTest.css';

/**
 * Component to test wallet connection during deployment
 */
const WalletConnectionTest = () => {
  const { 
    isConnected, 
    connect, 
    disconnect, 
    account, 
    balance, 
    networkName, 
    connectionError 
  } = useWeb3();
  
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(false);
  
  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [
      ...prev, 
      { 
        test, 
        result, 
        details, 
        timestamp: new Date().toISOString() 
      }
    ]);
  };
  
  const clearResults = () => {
    setTestResults([]);
  };
  
  const runTests = async () => {
    setRunningTests(true);
    clearResults();
    
    try {
      // Test localStorage for wallet preferences
      const preferredWallet = localStorage.getItem('preferredWallet');
      addTestResult(
        'Wallet Preference', 
        preferredWallet ? 'PASS' : 'INFO',
        preferredWallet ? `Preferred wallet: ${preferredWallet}` : 'No preferred wallet set'
      );
      
      // Test previous connection state
      const walletConnected = localStorage.getItem('walletConnected');
      addTestResult(
        'Previous Connection', 
        walletConnected ? 'INFO' : 'INFO',
        walletConnected ? 'Wallet was previously connected' : 'No previous connection'
      );
      
      // Test connection with Coinbase
      try {
        addTestResult('Coinbase Connection', 'RUNNING', 'Attempting to connect with Coinbase Wallet...');
        await connect('coinbase');
        
        if (isConnected && account) {
          addTestResult(
            'Coinbase Connection', 
            'PASS', 
            `Connected with account ${account} on ${networkName}`
          );
          
          // Test balance retrieval
          addTestResult(
            'Balance Retrieval', 
            balance ? 'PASS' : 'WARN',
            balance ? `Balance: ${balance} ETH` : 'Balance not available'
          );
          
          // Test disconnect
          addTestResult('Disconnect Test', 'RUNNING', 'Attempting to disconnect...');
          disconnect();
          
          // We need to wait for state to update
          setTimeout(() => {
            addTestResult(
              'Disconnect Test', 
              !isConnected ? 'PASS' : 'FAIL',
              !isConnected ? 'Disconnect successful' : 'Failed to disconnect'
            );
            
            // Test MetaMask connection
            try {
              addTestResult('MetaMask Connection', 'RUNNING', 'Attempting to connect with MetaMask...');
              connect('metamask').then(() => {
                if (isConnected && account) {
                  addTestResult(
                    'MetaMask Connection', 
                    'PASS', 
                    `Connected with account ${account} on ${networkName}`
                  );
                } else {
                  addTestResult('MetaMask Connection', 'FAIL', 'Failed to connect with MetaMask');
                }
                
                setRunningTests(false);
              }).catch(error => {
                addTestResult('MetaMask Connection', 'ERROR', `Error: ${error.message}`);
                setRunningTests(false);
              });
            } catch (error) {
              addTestResult('MetaMask Connection', 'ERROR', `Error: ${error.message}`);
              setRunningTests(false);
            }
          }, 2000);
        } else {
          addTestResult('Coinbase Connection', 'FAIL', 'Failed to connect with Coinbase Wallet');
          setRunningTests(false);
        }
      } catch (error) {
        addTestResult('Coinbase Connection', 'ERROR', `Error: ${error.message}`);
        setRunningTests(false);
      }
    } catch (error) {
      addTestResult('Test Suite', 'ERROR', `Unexpected error: ${error.message}`);
      setRunningTests(false);
    }
  };
  
  return (
    <div className="wallet-test-container">
      <h2>Wallet Connection Automated Tests</h2>
      
      <div className="test-controls">
        <button 
          onClick={runTests} 
          disabled={runningTests || isConnected}
          className="test-button run"
        >
          {runningTests ? 'Running Tests...' : 'Run Connection Tests'}
        </button>
        <button 
          onClick={clearResults}
          disabled={runningTests}
          className="test-button clear"
        >
          Clear Results
        </button>
      </div>
      
      <div className="test-results">
        <h3>Test Results</h3>
        {testResults.length === 0 ? (
          <p className="no-results">No tests have been run yet</p>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Result</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result, index) => (
                <tr key={index} className={`result-row ${result.result.toLowerCase()}`}>
                  <td>{result.test}</td>
                  <td className={`result-${result.result.toLowerCase()}`}>{result.result}</td>
                  <td>{result.details}</td>
                  <td>{new Date(result.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WalletConnectionTest;
