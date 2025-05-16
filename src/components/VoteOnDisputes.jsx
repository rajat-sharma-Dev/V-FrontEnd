import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import './VoteOnDisputes.css';

const VoteOnDisputes = ({ onBack }) => {
  const { account, signer, chainId } = useWeb3();
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState({});
  const [votingInProgress, setVotingInProgress] = useState(false);

  useEffect(() => {
    const fetchDisputedContracts = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call the contract
        // For now, we'll use mock data
        setTimeout(() => {
          const mockDisputes = [
            {
              id: '0x1234567890abcdef1234567890abcdef12345678',
              title: 'Software Development Contract #1',
              description: 'Dispute regarding deliverable quality in software project',
              buyer: '0xA1B2C3D4E5F6G7H8I9J0',
              seller: '0xB2C3D4E5F6G7H8I9J0A1',
              amount: '1.25 ETH',
              status: 'Disputed',
              disputeReason: 'Deliverables did not match specifications',
              createdAt: '2025-04-10',
              votesFor: 23,
              votesAgainst: 15,
              details: 'Buyer claims the delivered software has critical bugs and doesn\'t match the agreed specifications. Seller claims all requirements were met according to the contract terms.'
            },
            {
              id: '0xabcdef1234567890abcdef1234567890abcdef12',
              title: 'Marketing Services Agreement',
              description: 'Dispute over marketing campaign results',
              buyer: '0xC3D4E5F6G7H8I9J0A1B2',
              seller: '0xD4E5F6G7H8I9J0A1B2C3',
              amount: '3.5 ETH',
              status: 'Disputed',
              disputeReason: 'Campaign did not achieve promised metrics',
              createdAt: '2025-05-01',
              votesFor: 18,
              votesAgainst: 21,
              details: 'Buyer claims the marketing campaign did not reach the promised engagement levels and conversion rates. Seller argues that external market factors affected the campaign performance.'
            },
            {
              id: '0x9876543210fedcba9876543210fedcba98765432',
              title: 'NFT Artwork Commission',
              description: 'Dispute regarding artwork originality',
              buyer: '0xE5F6G7H8I9J0A1B2C3D4',
              seller: '0xF6G7H8I9J0A1B2C3D4E5',
              amount: '2.75 ETH',
              status: 'Disputed',
              disputeReason: 'Artwork is claimed to be plagiarized',
              createdAt: '2025-05-12',
              votesFor: 31,
              votesAgainst: 27,
              details: 'Buyer claims the commissioned NFT artwork contains elements plagiarized from another artist. Seller states the work is original and any similarities are coincidental.'
            }
          ];
          
          setDisputes(mockDisputes);
          setIsLoading(false);
        }, 1500);
        
      } catch (error) {
        console.error('Error fetching disputed contracts:', error);
        setIsLoading(false);
      }
    };

    fetchDisputedContracts();
  }, []);

  const handleVote = async (disputeId, voteType) => {
    setVotingInProgress(true);
    
    try {
      // In a real implementation, this would call the contract method to vote
      console.log(`Submitting vote: ${voteType} for dispute ${disputeId}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to reflect the vote
      setDisputes(prevDisputes => 
        prevDisputes.map(dispute => {
          if (dispute.id === disputeId) {
            if (voteType === 'for') {
              return { ...dispute, votesFor: dispute.votesFor + 1 };
            } else {
              return { ...dispute, votesAgainst: dispute.votesAgainst + 1 };
            }
          }
          return dispute;
        })
      );
      
      // Clear the vote selection for this dispute
      setSelectedVote(prev => ({ ...prev, [disputeId]: null }));
      
      // Show success message (you could add a toast notification here)
      console.log('Vote submitted successfully');
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setVotingInProgress(false);
    }
  };

  const calculateProgress = (votesFor, votesAgainst) => {
    const total = votesFor + votesAgainst;
    if (total === 0) return 50;
    return (votesFor / total) * 100;
  };

  return (
    <div className="vote-disputes-container">
      <div className="page-header">
        <button onClick={onBack} className="back-button">
          &larr; Back to Dashboard
        </button>
        <h2>Vote on Disputed Contracts</h2>
      </div>
      
      <div className="dispute-info-section">
        <div className="info-card">
          <h3>Validator Voting</h3>
          <p>As a validator, you help resolve disputes between buyers and sellers by voting on contract disputes. Your vote carries weight proportional to your staked amount.</p>
          <ul className="voting-info">
            <li>Review the contract details and dispute reason</li>
            <li>Cast your vote for or against the buyer's claim</li>
            <li>Earn CDT tokens for participating in votes</li>
          </ul>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading disputed contracts...</p>
        </div>
      ) : disputes.length > 0 ? (
        <div className="disputes-list">
          {disputes.map(dispute => (
            <div key={dispute.id} className="dispute-card">
              <div className="dispute-header">
                <h3>{dispute.title}</h3>
                <span className="dispute-status">{dispute.status}</span>
              </div>
              
              <div className="dispute-details">
                <div className="dispute-info">
                  <p><strong>Contract Amount:</strong> {dispute.amount}</p>
                  <p><strong>Dispute Reason:</strong> {dispute.disputeReason}</p>
                  <p><strong>Created:</strong> {dispute.createdAt}</p>
                </div>
                
                <div className="dispute-description">
                  <h4>Dispute Details</h4>
                  <p>{dispute.details}</p>
                </div>
                
                <div className="voting-progress">
                  <div className="progress-label">
                    <span>Buyer ({dispute.votesFor})</span>
                    <span>Seller ({dispute.votesAgainst})</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateProgress(dispute.votesFor, dispute.votesAgainst)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="voting-actions">
                  <div className="vote-options">
                    <label className={`vote-option ${selectedVote[dispute.id] === 'for' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name={`vote-${dispute.id}`} 
                        value="for"
                        checked={selectedVote[dispute.id] === 'for'}
                        onChange={() => setSelectedVote({...selectedVote, [dispute.id]: 'for'})}
                      />
                      <span>Support Buyer's Claim</span>
                    </label>
                    
                    <label className={`vote-option ${selectedVote[dispute.id] === 'against' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name={`vote-${dispute.id}`} 
                        value="against"
                        checked={selectedVote[dispute.id] === 'against'}
                        onChange={() => setSelectedVote({...selectedVote, [dispute.id]: 'against'})}
                      />
                      <span>Support Seller's Position</span>
                    </label>
                  </div>
                  
                  <button 
                    className="vote-submit-button"
                    disabled={!selectedVote[dispute.id] || votingInProgress}
                    onClick={() => handleVote(dispute.id, selectedVote[dispute.id])}
                  >
                    {votingInProgress ? 'Submitting Vote...' : 'Submit Vote'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-disputes">
          <p>There are currently no disputed contracts to vote on.</p>
        </div>
      )}
    </div>
  );
};

export default VoteOnDisputes;