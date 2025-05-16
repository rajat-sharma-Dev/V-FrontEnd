import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import './InteractContract.css';

const InteractContract = ({ contract, onBack }) => {
  const { isConnected, chainId, signer, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [contractDetails, setContractDetails] = useState(null);
  const [error, setError] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionType, setActionType] = useState('');
  const [selectedCondition, setSelectedCondition] = useState(null);
  
  // Load contract details
  useEffect(() => {
    const loadContractDetails = async () => {
      if (!isConnected || !contract || !contract.contractAddress) {
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        // In a real application, you would:
        // 1. Create a contract instance using the address
        // 2. Call appropriate methods to get the contract details
        // 3. Format the data for display
        
        // For demo purposes, using the passed in contract data
        const details = {
          ...contract,
          // Add any additional data we might need
          remainingTime: calculateRemainingTime(contract.timestamp, contract.deliveryDays),
          buyerAddress: account,
        };
        
        setContractDetails(details);
        setLoading(false);
      } catch (err) {
        console.error("Error loading contract details:", err);
        setError("Failed to load contract details");
        setLoading(false);
      }
    };
    
    loadContractDetails();
  }, [isConnected, contract, account, chainId]);
  
  // Calculate remaining time for contract delivery
  const calculateRemainingTime = (timestamp, deliveryDays) => {
    const creationTime = new Date(timestamp).getTime();
    const deadlineTime = creationTime + (deliveryDays * 24 * 60 * 60 * 1000);
    const currentTime = Date.now();
    
    if (currentTime > deadlineTime) {
      return "Expired";
    }
    
    const remaining = deadlineTime - currentTime;
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return `${days}d ${hours}h`;
  };
  
  // Handle approving a condition
  const handleApproveCondition = async (conditionIndex) => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setSelectedCondition(conditionIndex);
    setActionType('approve');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to approve this condition
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the contract details
      setContractDetails(prev => {
        const updated = {...prev};
        updated.conditions = [...prev.conditions];
        updated.conditions[conditionIndex] = {
          ...updated.conditions[conditionIndex],
          completed: true
        };
        return updated;
      });
      
      setProcessingAction(false);
      setSelectedCondition(null);
    } catch (err) {
      console.error("Error approving condition:", err);
      setError(`Failed to approve condition: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
      setSelectedCondition(null);
    }
  };
  
  // Handle rejecting a condition
  const handleRejectCondition = async (conditionIndex) => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setSelectedCondition(conditionIndex);
    setActionType('reject');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to reject this condition
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the contract details
      setContractDetails(prev => {
        const updated = {...prev};
        updated.conditions = [...prev.conditions];
        updated.conditions[conditionIndex] = {
          ...updated.conditions[conditionIndex],
          rejected: true,
          completed: false
        };
        return updated;
      });
      
      setProcessingAction(false);
      setSelectedCondition(null);
    } catch (err) {
      console.error("Error rejecting condition:", err);
      setError(`Failed to reject condition: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
      setSelectedCondition(null);
    }
  };
  
  // Handle initiating a dispute
  const handleInitiateDispute = async () => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setActionType('dispute');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to initiate a dispute
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the contract status
      setContractDetails(prev => ({
        ...prev,
        status: "disputed"
      }));
      
      setProcessingAction(false);
    } catch (err) {
      console.error("Error initiating dispute:", err);
      setError(`Failed to initiate dispute: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
    }
  };
  
  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };
  
  // Check if contract is completed
  const isContractCompleted = () => {
    if (!contractDetails || !contractDetails.conditions) return false;
    return contractDetails.conditions.every(c => c.completed);
  };
  
  // Check if condition can be interacted with
  const canInteractWithCondition = (condition, index) => {
    if (!contractDetails || processingAction) return false;
    if (contractDetails.status === "disputed" || contractDetails.status === "completed") return false;
    
    // Can't interact if already completed or rejected
    if (condition.completed || condition.rejected) return false;
    
    // For sequential conditions, only allow interaction with the next uncompleted condition
    const prevConditionsCompleted = contractDetails.conditions
      .slice(0, index)
      .every(c => c.completed);
    
    return prevConditionsCompleted;
  };
  
  return (
    <div className="interact-contract">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          &larr; Back to Contracts
        </button>
        <h2>Contract Details</h2>
      </div>
      
      {!isConnected ? (
        <div className="connect-prompt">
          <p>Please connect your wallet to interact with this contract.</p>
        </div>
      ) : loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading contract details...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : contractDetails ? (
        <div className="contract-interaction">
          {/* Contract Summary */}
          <div className="contract-summary">
            <div className="summary-header">
              <h3>Contract #{contractDetails.id || contractDetails.contractAddress.substring(0, 6)}</h3>
              <span className={`status-badge ${contractDetails.status}`}>
                {contractDetails.status.charAt(0).toUpperCase() + contractDetails.status.slice(1)}
              </span>
            </div>
            
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Contract Address:</span>
                <span className="summary-value">
                  {formatAddress(contractDetails.contractAddress)}
                </span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Seller:</span>
                <span className="summary-value address">
                  {formatAddress(contractDetails.sellerAddress)}
                </span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Remaining Time:</span>
                <span className="summary-value time">
                  {contractDetails.remainingTime}
                </span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Total Amount:</span>
                <span className="summary-value amount">
                  {contractDetails.price} {contractDetails.paymentToken}
                </span>
              </div>
            </div>
          </div>
          
          {/* Conditions List */}
          <div className="conditions-container">
            <h3>Conditions</h3>
            <div className="conditions-list">
              {contractDetails.conditions && contractDetails.conditions.map((condition, index) => (
                <div key={index} className={`condition-item ${condition.completed ? 'completed' : condition.rejected ? 'rejected' : ''}`}>
                  <div className="condition-content">
                    <div className="condition-header">
                      <h4>{condition.title}</h4>
                      {condition.completed ? (
                        <span className="condition-status completed">Completed</span>
                      ) : condition.rejected ? (
                        <span className="condition-status rejected">Rejected</span>
                      ) : (
                        <span className="condition-status pending">Pending</span>
                      )}
                    </div>
                    
                    <p className="condition-description">{condition.description}</p>
                    
                    {condition.advancePayment && (
                      <div className="advance-payment-tag">
                        Advance Payment: {condition.advanceAmount} {contractDetails.paymentToken}
                      </div>
                    )}
                  </div>
                  
                  <div className="condition-actions">
                    {canInteractWithCondition(condition, index) ? (
                      <>
                        <button 
                          className="approve-button"
                          onClick={() => handleApproveCondition(index)}
                          disabled={processingAction || selectedCondition === index && actionType === 'approve'}
                        >
                          {selectedCondition === index && actionType === 'approve' ? (
                            <span className="processing">Processing...</span>
                          ) : (
                            <>
                              <span className="icon">✓</span> Approve
                            </>
                          )}
                        </button>
                        
                        <button 
                          className="reject-button"
                          onClick={() => handleRejectCondition(index)}
                          disabled={processingAction || selectedCondition === index && actionType === 'reject'}
                        >
                          {selectedCondition === index && actionType === 'reject' ? (
                            <span className="processing">Processing...</span>
                          ) : (
                            <>
                              <span className="icon">✗</span> Reject
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="condition-status-message">
                        {condition.completed ? 
                          "This condition has been approved" : 
                          condition.rejected ? 
                            "This condition has been rejected" : 
                            "Complete previous conditions first"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Contract Actions */}
          <div className="contract-actions-container">
            {isContractCompleted() ? (
              <div className="contract-complete-message">
                <span className="success-icon">✓</span>
                <span>All conditions have been completed!</span>
              </div>
            ) : contractDetails.status === "disputed" ? (
              <div className="dispute-active-message">
                <span className="warning-icon">⚠️</span>
                <span>This contract is currently under dispute</span>
              </div>
            ) : (
              <div className="dispute-container">
                <p className="dispute-info">
                  If there is a disagreement or the seller fails to meet conditions, you can initiate a dispute.
                </p>
                <button 
                  className="dispute-button"
                  onClick={handleInitiateDispute}
                  disabled={processingAction && actionType === 'dispute'}
                >
                  {processingAction && actionType === 'dispute' ? 
                    "Processing dispute..." : 
                    "Initiate Dispute"
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-contract">
          <p>No contract selected or contract data unavailable.</p>
        </div>
      )}
    </div>
  );
};

export default InteractContract;
