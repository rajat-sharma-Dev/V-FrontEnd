import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig, createTokenContract } from '../utils/contractHelpers';
import './InteractContract.css'; // Reusing existing styles

/**
 * StakingPoolInteract Component
 * This component provides interface for interacting with the staking pool
 */
const StakingPoolInteract = ({ onBack, poolInfo }) => {
  const { isConnected, account, signer, chainId } = useWeb3();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStake = async (e) => {
    e.preventDefault();
    if (!isConnected || !signer || !stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Please connect your wallet and enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get validator contract
      const validatorContract = createContractFromConfig('VALIDATOR', chainId, signer);
      
      if (!validatorContract) {
        setError('Validator contract not found for this network');
        setLoading(false);
        return;
      }
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(stakeAmount);
      
      // Call stake function on the contract
      // For demo, we just simulate it
      console.log(`Staking ${stakeAmount} ETH into the pool`);
      
      // Mock transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`Successfully staked ${stakeAmount} ETH into the pool`);
      setStakeAmount('');
      setLoading(false);
    } catch (err) {
      console.error('Error staking:', err);
      setError(`Failed to stake: ${err.message}`);
      setLoading(false);
    }
  };

  const handleUnstake = async (e) => {
    e.preventDefault();
    if (!isConnected || !signer || !unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      setError('Please connect your wallet and enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get validator contract
      const validatorContract = createContractFromConfig('VALIDATOR', chainId, signer);
      
      if (!validatorContract) {
        setError('Validator contract not found for this network');
        setLoading(false);
        return;
      }
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(unstakeAmount);
      
      // Call unstake function on the contract
      // For demo, we just simulate it
      console.log(`Unstaking ${unstakeAmount} ETH from the pool`);
      
      // Mock transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`Successfully unstaked ${unstakeAmount} ETH from the pool`);
      setUnstakeAmount('');
      setLoading(false);
    } catch (err) {
      console.error('Error unstaking:', err);
      setError(`Failed to unstake: ${err.message}`);
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!isConnected || !signer || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please connect your wallet and enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(withdrawAmount);
      
      // Call withdraw function to claim CDT rewards
      // For demo, we just simulate it
      console.log(`Withdrawing ${withdrawAmount} CDT rewards`);
      
      // Mock transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`Successfully claimed ${withdrawAmount} CDT rewards`);
      setWithdrawAmount('');
      setLoading(false);
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError(`Failed to withdraw: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="interact-contract">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          &larr; Back to Validator Dashboard
        </button>
        <h2>Staking Pool Interaction</h2>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Processing transaction...</p>
        </div>
      )}
      
      {/* Error and success messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* Pool Information */}
      <div className="contract-summary">
        <h3>Pool Information</h3>
        <div className="summary-details">
          <div className="summary-row">
            <span className="summary-label">Total Staked:</span>
            <span className="summary-value amount">{poolInfo?.totalStaked || '0'} ETH</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">APY:</span>
            <span className="summary-value">{poolInfo?.apy || '0'}%</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Validators:</span>
            <span className="summary-value">{poolInfo?.validators || '0'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Your Stake:</span>
            <span className="summary-value amount">{poolInfo?.yourStake || '0'} ETH</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Your CDT Balance:</span>
            <span className="summary-value amount">{poolInfo?.cdtBalance || '0'} CDT</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Earned Rewards:</span>
            <span className="summary-value amount">{poolInfo?.rewards || '0'} CDT</span>
          </div>
        </div>
      </div>
      
      <div className="actions-grid">
        {/* Stake Form */}
        <div className="action-card">
          <h3>Stake ETH</h3>
          <form onSubmit={handleStake}>
            <div className="form-group">
              <label htmlFor="stakeAmount">Amount (ETH)</label>
              <input
                id="stakeAmount"
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.0"
                step="any"
                min="0.01"
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="action-button" 
              disabled={loading || !isConnected}
            >
              Stake ETH
            </button>
          </form>
        </div>
        
        {/* Unstake Form */}
        <div className="action-card">
          <h3>Unstake ETH</h3>
          <form onSubmit={handleUnstake}>
            <div className="form-group">
              <label htmlFor="unstakeAmount">Amount (ETH)</label>
              <input
                id="unstakeAmount"
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="0.0"
                step="any"
                min="0.01"
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="action-button" 
              disabled={loading || !isConnected}
            >
              Unstake ETH
            </button>
          </form>
        </div>
        
        {/* Withdraw Rewards Form */}
        <div className="action-card">
          <h3>Claim CDT Rewards</h3>
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label htmlFor="withdrawAmount">Amount (CDT)</label>
              <input
                id="withdrawAmount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.0"
                step="any"
                min="0.01"
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="action-button" 
              disabled={loading || !isConnected}
            >
              Claim CDT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StakingPoolInteract;
