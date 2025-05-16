import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import './InteractContract.css'; // Reusing existing CSS
import './SellerInteractContract.css'; // Additional seller-specific styles

const SellerInteractContract = ({ contract, onBack }) => {
  const { isConnected, chainId, account } = useWeb3(); // Removed unused signer variable
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
          sellerAddress: account,
        };
        
        // For seller UI, if buyer address isn't set, we should set it
        if (!details.buyerAddress) {
          details.buyerAddress = contract.buyerAddress || "0x1234567890123456789012345678901234567890"; // Fallback to ensure UI works
        }
        
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
  
  // Handle marking a condition as complete (request approval)
  const handleMarkConditionComplete = async (conditionIndex) => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setSelectedCondition(conditionIndex);
    setActionType('markComplete');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to request approval for this condition
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the contract details to show pending approval
      setContractDetails(prev => {
        const updated = {...prev};
        updated.conditions = [...prev.conditions];
        updated.conditions[conditionIndex] = {
          ...updated.conditions[conditionIndex],
          pendingApproval: true
        };
        return updated;
      });
      
      setProcessingAction(false);
      setSelectedCondition(null);
    } catch (err) {
      console.error("Error marking condition as complete:", err);
      setError(`Failed to mark condition as complete: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
      setSelectedCondition(null);
    }
  };
  
  // Handle initiating a contract
  const handleInitiateContract = async () => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setActionType('initiate');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to initiate the contract
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update contract status
      setContractDetails(prev => ({
        ...prev,
        status: 'active'
      }));
      
      setProcessingAction(false);
    } catch (err) {
      console.error("Error initiating contract:", err);
      setError(`Failed to initiate contract: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
    }
  };
  
  // Handle releasing advance payment
  const handleReleaseAdvance = async (conditionIndex) => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setSelectedCondition(conditionIndex);
    setActionType('releaseAdvance');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to release the advance payment
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update condition to show advance released
      setContractDetails(prev => {
        const updated = {...prev};
        updated.conditions = [...prev.conditions];
        updated.conditions[conditionIndex] = {
          ...updated.conditions[conditionIndex],
          advanceReleased: true
        };
        return updated;
      });
      
      setProcessingAction(false);
      setSelectedCondition(null);
    } catch (err) {
      console.error("Error releasing advance payment:", err);
      setError(`Failed to release advance payment: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
      setSelectedCondition(null);
    }
  };
  
  // Handle completing the entire contract
  const handleCompleteContract = async () => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setActionType('complete');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to mark the contract as complete
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update contract status
      setContractDetails(prev => ({
        ...prev,
        status: 'completed'
      }));
      
      setProcessingAction(false);
    } catch (err) {
      console.error("Error completing contract:", err);
      setError(`Failed to complete contract: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
    }
  };
  
  // Handle refunding the buyer
  const handleRefundBuyer = async () => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setActionType('refund');
    setProcessingAction(true);
    
    try {
      // In a real application, you would:
      // 1. Call the smart contract to refund the buyer
      // 2. Wait for transaction confirmation
      // 3. Update the UI based on the result
      
      // For demo purposes, simulate a transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update contract status
      setContractDetails(prev => ({
        ...prev,
        status: 'refunded'
      }));
      
      setProcessingAction(false);
    } catch (err) {
      console.error("Error refunding buyer:", err);
      setError(`Failed to refund buyer: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update contract status
      setContractDetails(prev => ({
        ...prev,
        status: 'disputed'
      }));
      
      setProcessingAction(false);
    } catch (err) {
      console.error("Error initiating dispute:", err);
      setError(`Failed to initiate dispute: ${err.message || "Unknown error"}`);
      setProcessingAction(false);
    }
  };
  
  // This function is used by the UI, so we're keeping it

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
    
    // Can't interact if already completed
    if (condition.completed) return false;
    
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
                <span className="summary-label">Buyer:</span>
                <span className="summary-value address">
                  {formatAddress(contractDetails.buyerAddress)}
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
              
              {parseFloat(contractDetails.totalAdvancePayment) > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Total Advance:</span>
                  <span className="summary-value amount">
                    {contractDetails.totalAdvancePayment} {contractDetails.paymentToken}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Conditions List */}
          <div className="conditions-container">
            <h3>Conditions</h3>
            <div className="conditions-list">
              {contractDetails.conditions && contractDetails.conditions.map((condition, index) => (
                <div key={index} className={`condition-item ${condition.completed ? 'completed' : condition.pendingApproval ? 'pending' : ''}`}>
                  <div className="condition-content">
                    <div className="condition-header">
                      <h4>{condition.title}</h4>
                      {condition.completed ? (
                        <span className="condition-status completed">Completed</span>
                      ) : condition.pendingApproval ? (
                        <span className="condition-status pending">Pending Approval</span>
                      ) : (
                        <span className="condition-status pending">Pending</span>
                      )}
                    </div>
                    
                    <p className="condition-description">{condition.description}</p>
                    
                    {condition.advancePayment && (
                      <div className="advance-payment-tag">
                        Advance Payment: {condition.advanceAmount} {contractDetails.paymentToken}
                        {condition.advanceReleased && <span className="released-tag"> (Released)</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="condition-actions">
                    {canInteractWithCondition(condition, index) && !condition.pendingApproval && (
                      <>
                        <button 
                          className="approve-button"
                          onClick={() => handleMarkConditionComplete(index)}
                          disabled={processingAction || selectedCondition === index && actionType === 'markComplete'}
                        >
                          {selectedCondition === index && actionType === 'markComplete' ? (
                            <span className="processing">Processing...</span>
                          ) : (
                            <>
                              <span className="icon">✓</span> Mark as Complete
                            </>
                          )}
                        </button>
                      </>
                    )}
                    
                    {condition.completed && condition.advancePayment && !condition.advanceReleased && (
                      <button 
                        className="release-button"
                        onClick={() => handleReleaseAdvance(index)}
                        disabled={processingAction || selectedCondition === index && actionType === 'releaseAdvance'}
                      >
                        {selectedCondition === index && actionType === 'releaseAdvance' ? (
                          <span className="processing">Processing...</span>
                        ) : (
                          <>
                            <span className="icon">💰</span> Release Advance
                          </>
                        )}
                      </button>
                    )}
                    
                    {condition.pendingApproval && (
                      <div className="condition-status-message">
                        Waiting for buyer approval
                      </div>
                    )}
                    
                    {!canInteractWithCondition(condition, index) && !condition.completed && !condition.pendingApproval && (
                      <div className="condition-status-message">
                        Complete previous conditions first
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Contract Actions */}
          <div className="contract-actions-container">
            {contractDetails.status === 'pending' && (
              <div className="contract-action-group">
                <button 
                  className="primary-button"
                  onClick={handleInitiateContract}
                  disabled={processingAction}
                >
                  {processingAction && actionType === 'initiate' ? 
                    "Processing..." : 
                    "Initiate Contract"
                  }
                </button>
                <p className="action-description">
                  Initiating the contract will start the delivery timeframe.
                </p>
              </div>
            )}
            
            {isContractCompleted() ? (
              <div className="contract-complete-message">
                <span className="success-icon">✓</span>
                <span>All conditions have been completed!</span>
                {contractDetails.status === 'active' && (
                  <button 
                    className="complete-contract-button"
                    onClick={handleCompleteContract}
                    disabled={processingAction}
                  >
                    {processingAction && actionType === 'complete' ? 
                      "Processing..." : 
                      "Complete Contract & Release Payment"
                    }
                  </button>
                )}
              </div>
            ) : contractDetails.status === "disputed" ? (
              <div className="dispute-active-message">
                <span className="warning-icon">⚠️</span>
                <span>This contract is currently under dispute</span>
              </div>
            ) : (
              <div className="contract-actions-buttons">
                {contractDetails.status === 'active' && (
                  <>
                    <div className="dispute-container">
                      <p className="dispute-info">
                        Contract actions:
                      </p>
                      <div className="button-group">
                        <button 
                          className="complete-button"
                          onClick={handleCompleteContract}
                          disabled={processingAction || !isContractCompleted()}
                        >
                          {processingAction && actionType === 'complete' ? 
                            "Processing..." : 
                            "Complete Contract"
                          }
                        </button>
                        
                        <button 
                          className="dispute-button"
                          onClick={handleInitiateDispute}
                          disabled={processingAction}
                        >
                          {processingAction && actionType === 'dispute' ? 
                            "Processing..." : 
                            "Initiate Dispute"
                          }
                        </button>
                        
                        <button 
                          className="refund-button"
                          onClick={handleRefundBuyer}
                          disabled={processingAction}
                        >
                          {processingAction && actionType === 'refund' ? 
                            "Processing..." : 
                            "Issue Refund"
                          }
                        </button>
                      </div>
                    </div>
                  </>
                )}
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

export default SellerInteractContract;
