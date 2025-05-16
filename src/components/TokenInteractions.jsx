import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { createContractInstance, getTokenBalance, getTokenSymbol } from '../utils/contractHelpers';
import { ERC20_ABI } from '../contracts/ERC20ABI';

/**
 * Token Interaction Component
 */
const TokenInteractions = () => {
  const { isConnected, account, signer } = useWeb3();
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  // Create contract instance when token address changes
  useEffect(() => {
    const initContract = async () => {
      if (isConnected && signer && tokenAddress && tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        try {
          setIsLoading(true);
          setError('');
          
          const contract = createContractInstance(tokenAddress, ERC20_ABI, signer);
          setTokenContract(contract);
          
          // Get token info
          const symbol = await getTokenSymbol(contract);
          setTokenSymbol(symbol);
          
          // Get token balance
          if (account) {
            const balance = await getTokenBalance(contract, account);
            setTokenBalance(balance);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error initializing contract:', error);
          setError('Failed to initialize token contract. Is this a valid ERC20 token?');
          setTokenContract(null);
          setTokenSymbol('');
          setTokenBalance('0');
          setIsLoading(false);
        }
      } else {
        setTokenContract(null);
        setTokenSymbol('');
        setTokenBalance('0');
      }
    };
    
    initContract();
  }, [isConnected, signer, tokenAddress, account]);

  // Transfer tokens
  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!tokenContract || !recipient.match(/^0x[a-fA-F0-9]{40}$/) || !amount || amount <= 0) {
      setError('Please enter a valid recipient address and amount');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setTxHash('');
      
      // Get decimals
      const decimals = await tokenContract.decimals();
      
      // Convert amount to token units
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);
      
      // Send transaction
      const tx = await tokenContract.transfer(recipient, amountInWei);
      setTxHash(tx.hash);
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Refresh balance
      const newBalance = await getTokenBalance(tokenContract, account);
      setTokenBalance(newBalance);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Transfer error:', error);
      setError(`Transfer failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="token-interactions">
      <h2>Token Interactions</h2>
      
      {!isConnected ? (
        <p>Please connect your wallet to interact with tokens</p>
      ) : (
        <>
          <div className="token-lookup">
            <h3>Token Lookup</h3>
            <div className="form-group">
              <label>
                Token Address:
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                />
              </label>
            </div>
            
            {isLoading ? (
              <p>Loading token data...</p>
            ) : tokenSymbol ? (
              <div className="token-info">
                <p>
                  <strong>Symbol:</strong> {tokenSymbol}
                </p>
                <p>
                  <strong>Balance:</strong> {tokenBalance} {tokenSymbol}
                </p>
              </div>
            ) : null}
          </div>
          
          {tokenContract && (
            <div className="token-transfer">
              <h3>Transfer Tokens</h3>
              <form onSubmit={handleTransfer}>
                <div className="form-group">
                  <label>
                    Recipient Address:
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x..."
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Amount:
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.000001"
                      min="0"
                    />
                  </label>
                </div>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : `Transfer ${tokenSymbol}`}
                </button>
              </form>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          {txHash && (
            <div className="success-message">
              <p>Transaction sent: {txHash}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TokenInteractions;
