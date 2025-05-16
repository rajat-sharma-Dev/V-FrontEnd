import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createTokenContract } from '../utils/contractHelpers';
import WalletConnect from '../components/WalletConnect';
import Navigation from '../components/Navigation';
import StakingPoolInteract from '../components/StakingPoolInteract';
import VoteOnDisputes from '../components/VoteOnDisputes';
import RedeemRewards from '../components/RedeemRewards';
import ViewContracts from '../components/ViewContracts';
import '../components/StakingPoolInteract.css';
import './Validator.css';

const Validator = () => {
  const { isConnected, account, chainId, signer } = useWeb3();
  const [showStakingInteraction, setShowStakingInteraction] = useState(false);
  const [showVoteOnDisputes, setShowVoteOnDisputes] = useState(false);
  const [showRedeemRewards, setShowRedeemRewards] = useState(false);
  const [showViewContracts, setShowViewContracts] = useState(false);
  const [cdtBalance, setCDTBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState({
    totalStaked: '10,245.86',
    apy: '5.2',
    validators: '320',
    yourStake: '0',
    cdtBalance: '0',
    rewards: '0',
    lastReward: '0',
    stakingPeriod: '30 days'
  });

  // Fetch CDT balance and staking pool info
  useEffect(() => {
    const fetchCDTBalance = async () => {
      if (!isConnected || !account || !signer || !chainId) {
        return;
      }

      setIsLoading(true);
      try {
        // Create CDT token contract instance
        const cdtTokenContract = createTokenContract('CDT', chainId, signer);
        
        if (cdtTokenContract) {
          // Get balance
          const balance = await cdtTokenContract.balanceOf(account);
          const formattedBalance = ethers.formatUnits(balance, 18);
          setCDTBalance(formattedBalance);
          
          // Update pool info with balance
          setPoolInfo(prev => ({
            ...prev,
            cdtBalance: formattedBalance
          }));
        }

        // In a real app, we would also fetch staking pool information
        // For this example, we'll just simulate some data with delay
        setTimeout(() => {
          // Simulating a user with some stake when connected
          if (isConnected) {
            setPoolInfo(prev => ({
              ...prev,
              yourStake: '5.25',
              rewards: '12.75',
              lastReward: '0.75'
            }));
            setIsLoading(false);
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching CDT balance:', error);
        setIsLoading(false);
      }
    };

    fetchCDTBalance();
  }, [isConnected, account, chainId, signer]);

  // View handler to reset all view states except the one being shown
  const handleViewChange = (view) => {
    setShowStakingInteraction(view === 'staking');
    setShowVoteOnDisputes(view === 'voting');
    setShowRedeemRewards(view === 'rewards');
    setShowViewContracts(view === 'viewContracts');
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1>Validator Dashboard</h1>
        <WalletConnect />
      </header>
      <Navigation />
      
      <main className="main-content">
        {showStakingInteraction ? (
          <StakingPoolInteract 
            onBack={() => handleViewChange(null)} 
            poolInfo={poolInfo}
          />
        ) : showVoteOnDisputes ? (
          <VoteOnDisputes 
            onBack={() => handleViewChange(null)}
          />
        ) : showRedeemRewards ? (
          <RedeemRewards 
            onBack={() => handleViewChange(null)}
            cdtBalance={cdtBalance}
          />
        ) : showViewContracts ? (
          <div className="view-contracts-wrapper">
            <div className="section-header">
              <button onClick={() => handleViewChange(null)} className="back-button">
                &larr; Back
              </button>
              <h2>Disputed Contracts</h2>
            </div>
            <ViewContracts userRole="validator" />
          </div>
        ) : (
          <>
            {/* Enhanced Staking Pool Stats Section */}
            <div className="staking-pool-overview">
              <div className="pool-header">
                <h3>Staking Pool Overview</h3>
                {isConnected && (
                  <button 
                    className="interact-pool-button"
                    onClick={() => handleViewChange('staking')}
                  >
                    Interact with Pool
                  </button>
                )}
              </div>
              
              {isLoading ? (
                <div className="loading-indicator">
                  <div className="loading-spinner"></div>
                  <p>Loading pool data...</p>
                </div>
              ) : (
                <div className="staking-data-container">
                  <div className="pool-data-section">
                    <h4>Pool Statistics</h4>
                    <div className="pool-data-grid">
                      <div className="data-item">
                        <span className="data-label">Total Staked</span>
                        <span className="data-value">{poolInfo.totalStaked} ETH</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Active Validators</span>
                        <span className="data-value">{poolInfo.validators}</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Pool APY</span>
                        <span className="data-value">{poolInfo.apy}%</span>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Min Staking Period</span>
                        <span className="data-value">{poolInfo.stakingPeriod}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <div className="user-data-section">
                      <h4>Your Staking Position</h4>
                      <div className="user-data-grid">
                        <div className="data-item highlight">
                          <span className="data-label">Your CDT Balance</span>
                          <span className="data-value">{cdtBalance} CDT</span>
                        </div>
                        <div className="data-item">
                          <span className="data-label">Your Pool Contribution</span>
                          <span className="data-value">{poolInfo.yourStake} ETH</span>
                        </div>
                        <div className="data-item highlight">
                          <span className="data-label">Rewards Earned</span>
                          <span className="data-value">{poolInfo.rewards} CDT</span>
                        </div>
                        <div className="data-item">
                          <span className="data-label">Last Reward</span>
                          <span className="data-value">{poolInfo.lastReward} CDT</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="connect-wallet-prompt">
                      <p>Connect your wallet to view your staking position and interact with the pool</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Validator Actions Section */}
            {isConnected && (
              <div className="validator-actions">
                <h3>Validator Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="action-button vote-button"
                    onClick={() => handleViewChange('voting')}
                  >
                    <span className="button-icon">🗳️</span>
                    <span>Vote on Disputes</span>
                    <span className="button-description">Review and vote on disputed contracts</span>
                  </button>
                  
                  <button 
                    className="action-button view-button"
                    onClick={() => handleViewChange('viewContracts')}
                  >
                    <span className="button-icon">👁️</span>
                    <span>All Disputed Contracts</span>
                    <span className="button-description">View all contracts with active disputes</span>
                  </button>
                  
                  <button 
                    className="action-button redeem-button"
                    onClick={() => handleViewChange('rewards')}
                  >
                    <span className="button-icon">💰</span>
                    <span>Redeem Rewards</span>
                    <span className="button-description">Claim your accumulated CDT rewards</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Validator;
