import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import './RedeemRewards.css';

const RedeemRewards = ({ onBack, cdtBalance }) => {
  const { account, signer, chainId } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState({
    pendingRewards: '0',
    claimableRewards: '0',
    totalEarned: '0',
    rewardsHistory: []
  });
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    const fetchRewardsData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call the contract to get rewards data
        // For now, we'll use mock data
        setTimeout(() => {
          const mockRewardsData = {
            pendingRewards: '5.25',
            claimableRewards: '12.75',
            totalEarned: '48.50',
            rewardsHistory: [
              {
                id: '1',
                amount: '8.5',
                timestamp: '2025-05-10T14:30:00',
                txHash: '0x123...abc',
                status: 'Claimed',
                source: 'Staking Rewards'
              },
              {
                id: '2',
                amount: '12.25',
                timestamp: '2025-05-01T10:15:00',
                txHash: '0x456...def',
                status: 'Claimed',
                source: 'Dispute Resolution'
              },
              {
                id: '3',
                amount: '15.0',
                timestamp: '2025-04-22T09:45:00',
                txHash: '0x789...ghi',
                status: 'Claimed',
                source: 'Staking Rewards'
              }
            ]
          };
          
          setRewardsData(mockRewardsData);
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching rewards data:', error);
        setIsLoading(false);
      }
    };

    fetchRewardsData();
  }, [account, chainId]);

  const handleRedeemRewards = async () => {
    setIsRedeeming(true);
    
    try {
      // In a real implementation, this would call the contract to redeem rewards
      console.log('Redeeming rewards...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update rewards data to reflect claim
      setRewardsData(prev => {
        const newHistory = [
          {
            id: Date.now().toString(),
            amount: prev.claimableRewards,
            timestamp: new Date().toISOString(),
            txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
            status: 'Claimed',
            source: 'Manual Claim'
          },
          ...prev.rewardsHistory
        ];
        
        return {
          ...prev,
          claimableRewards: '0',
          totalEarned: prev.totalEarned, // This wouldn't change as it's the lifetime total
          rewardsHistory: newHistory
        };
      });
      
      setRedeemSuccess(true);
      
      // Reset success message after a delay
      setTimeout(() => {
        setRedeemSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error redeeming rewards:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="redeem-rewards-container">
      <div className="page-header">
        <button onClick={onBack} className="back-button">
          &larr; Back to Dashboard
        </button>
        <h2>Redeem Validator Rewards</h2>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading your rewards data...</p>
        </div>
      ) : (
        <>
          <div className="rewards-overview">
            <div className="rewards-card">
              <div className="rewards-header">
                <h3>Your CDT Rewards</h3>
              </div>
              <div className="rewards-stats">
                <div className="rewards-stat">
                  <span className="stat-label">Current CDT Balance</span>
                  <span className="stat-value highlight">{cdtBalance} CDT</span>
                </div>
                <div className="rewards-stat">
                  <span className="stat-label">Claimable Rewards</span>
                  <span className="stat-value highlight">{rewardsData.claimableRewards} CDT</span>
                </div>
                <div className="rewards-stat">
                  <span className="stat-label">Pending Rewards</span>
                  <span className="stat-value">{rewardsData.pendingRewards} CDT</span>
                  <span className="stat-note">Will be available in 7 days</span>
                </div>
                <div className="rewards-stat">
                  <span className="stat-label">Total Earned Lifetime</span>
                  <span className="stat-value">{rewardsData.totalEarned} CDT</span>
                </div>
              </div>
              
              {parseFloat(rewardsData.claimableRewards) > 0 ? (
                <div className="claim-action">
                  <button 
                    className="claim-button"
                    onClick={handleRedeemRewards}
                    disabled={isRedeeming || parseFloat(rewardsData.claimableRewards) <= 0}
                  >
                    {isRedeeming ? 'Processing...' : `Claim ${rewardsData.claimableRewards} CDT Rewards`}
                  </button>
                  
                  {redeemSuccess && (
                    <div className="success-message">
                      <span>✓</span> Rewards successfully claimed!
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-rewards-message">
                  <p>You don't have any rewards available to claim at this time.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="rewards-history">
            <h3>Rewards History</h3>
            
            {rewardsData.rewardsHistory.length > 0 ? (
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewardsData.rewardsHistory.map(reward => (
                      <tr key={reward.id}>
                        <td>{formatDate(reward.timestamp)}</td>
                        <td className="amount-cell">{reward.amount} CDT</td>
                        <td>{reward.source}</td>
                        <td>
                          <span className={`status-badge ${reward.status.toLowerCase()}`}>
                            {reward.status}
                          </span>
                        </td>
                        <td className="tx-hash">
                          <a href={`https://etherscan.io/tx/${reward.txHash}`} target="_blank" rel="noopener noreferrer">
                            {reward.txHash}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-history">
                <p>No rewards have been claimed yet.</p>
              </div>
            )}
          </div>
          
          <div className="rewards-info">
            <h3>About Validator Rewards</h3>
            <div className="info-box">
              <p>As a validator, you earn CDT tokens for:</p>
              <ul>
                <li><strong>Staking:</strong> Earn proportional rewards based on your staked amount</li>
                <li><strong>Dispute Resolution:</strong> Earn additional rewards for participating in contract dispute votes</li>
                <li><strong>Network Support:</strong> Earn rewards for maintaining high uptime as a validator</li>
              </ul>
              <p><strong>Note:</strong> Newly earned rewards have a 7-day lock period before they can be claimed.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RedeemRewards;