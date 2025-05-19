import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import './InteractContract.css'; // Reusing existing CSS
import './SellerInteractContract.css'; // Additional seller-specific styles

const SellerInteractContract = ({ contract, onBack }) => {
  const { isConnected, chainId, account, signer } = useWeb3();
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
        console.log("Cannot load contract details - missing prerequisites:", { 
          isConnected, 
          contractExists: !!contract, 
          contractAddressExists: contract ? !!contract.contractAddress : false 
        });
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        console.log("Creating contract instance for address:", contract.contractAddress);
        
        // Create a contract instance using the address
        const escrowContract = await createContractFromConfig(
          'CONFIDENTIAL_ESCROW',
          chainId,
          signer,
          contract.contractAddress
        );
        
        if (!escrowContract) {
          console.error("Failed to create contract instance for address:", contract.contractAddress);
          setError("Failed to create contract instance");
          setLoading(false);
          return;
        }
        
        console.log("Contract instance created successfully:", escrowContract.target);
        
        // Fetch token address from the contract
        try {
            const tokenAddress = await escrowContract.getToken();
            console.log("Token address fetched:", tokenAddress);
            
            // Try to get token symbol if it's an ERC20
            let tokenSymbol = "";
            try {
              // Create a minimal ERC20 interface to call symbol()
              const tokenContract = new ethers.Contract(
                tokenAddress,
                ['function symbol() view returns (string)'],
                signer
              );
              tokenSymbol = await tokenContract.symbol();
            } catch (err) {
              console.warn("Could not fetch token symbol:", err.message);
              // If we can't get the symbol, use a short version of the address
              tokenSymbol = `${tokenAddress.substring(0, 6)}...${tokenAddress.substring(38)}`;
            }
            
            // Check if contract has been deposited by fetching contract info
            let depositStatus = false;
            try {
              const contractInfo = await escrowContract.getContractInfo();
              console.log("Contract info:", contractInfo);
              // Status enum: 0 = IN_PROGRESS, 1 = FUNDS_LOCKED, 2 = COMPLETE
              const statusValue = Number(contractInfo[3]); // The 4th return value is the status
              
              // If status is FUNDS_LOCKED (1) or COMPLETE (2), funds have been deposited
              depositStatus = statusValue > 0;
              console.log("Deposit status:", depositStatus);
            } catch (err) {
              console.warn("Could not fetch contract status:", err.message);
            }
            
            // Create details object with the contract data plus additional information
            const details = {
              ...contract,
              tokenAddress,
              tokenSymbol,
              paymentTokenSymbol: tokenSymbol,
              isDeposited: depositStatus,
              // Add any additional data we might need
              remainingTime: calculateRemainingTime(contract.timestamp, contract.deliveryDays),
              sellerAddress: account,
            };
            
            // For seller UI, if buyer address isn't set, we should set it
            if (!details.buyerAddress) {
              details.buyerAddress = contract.buyerAddress || "0x1234567890123456789012345678901234567890"; // Fallback to ensure UI works
            }
            
            // Make sure each condition has approval tracking
            if (details.conditions) {
              details.conditions = details.conditions.map(condition => ({
                ...condition,
                approvedByBuyer: condition.approvedByBuyer || false,
                approvedBySeller: condition.approvedBySeller || false,
                // Mark as completed if both parties have approved or if completed flag is true
                completed: condition.completed || (condition.approvedByBuyer && condition.approvedBySeller)
              }));
            }
            
            setContractDetails(details);
          } catch (err) {
            console.error("Error fetching token address:", err);
            
            // If we can't fetch the token, still proceed with the contract data we have
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
            
            // Make sure each condition has approval tracking
            if (details.conditions) {
              details.conditions = details.conditions.map(condition => ({
                ...condition,
                approvedByBuyer: condition.approvedByBuyer || false,
                approvedBySeller: condition.approvedBySeller || false,
                // Mark as completed if both parties have approved or if completed flag is true
                completed: condition.completed || (condition.approvedByBuyer && condition.approvedBySeller)
              }));
            }
            
            setContractDetails(details);
            setLoading(false);
          }
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
  
  // Handle approving a condition as the seller
  const handleMarkConditionComplete = async (conditionIndex) => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setSelectedCondition(conditionIndex);
    setActionType('markComplete');
    setProcessingAction(true);
    
    try {
      // Get the condition key from the title (hash of the title)
      const conditionTitle = contractDetails.conditions[conditionIndex].title;
      
      // Create contract instance
      const escrowContract = createContractFromConfig(
        'CONFIDENTIAL_ESCROW',
        chainId,
        signer, // Make sure signer is properly imported in component props
        contractDetails.contractAddress
      );
      
      if (!escrowContract) {
        throw new Error("Unable to connect to the contract");
      }
      
      // Get condition key from the contract
      const conditionKey = await escrowContract.getConditionKey(conditionTitle);
      
      // Call the approveCondition function on the contract
      const tx = await escrowContract.approveCondition(conditionKey);
      await tx.wait();
      
      // Update the contract details
      setContractDetails(prev => {
        const updated = {...prev};
        updated.conditions = [...prev.conditions];
        updated.conditions[conditionIndex] = {
          ...updated.conditions[conditionIndex],
          approvedBySeller: true
        };
        
        // Mark as completed if both buyer and seller approved
        if (updated.conditions[conditionIndex].approvedByBuyer && 
            updated.conditions[conditionIndex].approvedBySeller) {
          updated.conditions[conditionIndex].completed = true;
        }
        
        return updated;
      });
      
      // No need to update localStorage as contract state is stored on blockchain
      
      setProcessingAction(false);
      setSelectedCondition(null);
    } catch (err) {
      console.error("Error approving condition:", err);
      setError(`Failed to approve condition: ${err.message || "Unknown error"}`);
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
    
    // Cannot interact if funds have not been deposited
    if (!contractDetails.isDeposited) return false;
    
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
                  {contractDetails.contractAddress || "N/A"}
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
                  {contractDetails.price} {contractDetails.paymentTokenSymbol || 
                  (contractDetails.paymentToken !== "0x1111111111111111111111111111111111111111" ? 
                    contractDetails.paymentToken : "")}
                </span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Payment Token:</span>
                <span className="summary-value token">
                  {contractDetails.tokenSymbol || "Unknown Token"} 
                  {contractDetails.tokenAddress && (
                    <span className="token-address">
                      ({formatAddress(contractDetails.tokenAddress)})
                    </span>
                  )}
                </span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Network:</span>
                <span className="summary-value network">
                  {chainId === 8453 ? "Base Mainnet" : chainId === 84532 ? "Base Sepolia" : `Chain ID: ${chainId}`}
                </span>
              </div>
              
              {parseFloat(contractDetails.totalAdvancePayment) > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Total Advance:</span>
                  <span className="summary-value amount">
                    {contractDetails.totalAdvancePayment} {contractDetails.paymentTokenSymbol || 
                    (contractDetails.paymentToken !== "0x1111111111111111111111111111111111111111" ? 
                      contractDetails.paymentToken : "")}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Deposit Status */}
          {!contractDetails.isDeposited && (
            <div className="deposit-status not-deposited">
              <div className="status-badge waiting">
                <span className="icon">⚠️</span> Waiting for buyer to deposit funds
              </div>
              <p className="deposit-info-message">The buyer must deposit the full contract amount before either party can interact with conditions.</p>
            </div>
          )}
          
          {contractDetails.isDeposited && (
            <div className="deposit-status">
              <div className="status-badge deposited">
                <span className="icon">✓</span> Funds Deposited
              </div>
            </div>
          )}
          
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
                    
                    <div className="condition-approval-status">
                      <div className="approval-item">
                        <span className="approval-label">Buyer:</span>
                        <span className={`approval-value ${condition.approvedByBuyer ? 'approved' : 'pending'}`}>
                          {condition.approvedByBuyer ? '✓ Approved' : 'Pending'}
                        </span>
                      </div>
                      <div className="approval-item">
                        <span className="approval-label">Seller:</span>
                        <span className={`approval-value ${condition.approvedBySeller ? 'approved' : 'pending'}`}>
                          {condition.approvedBySeller ? '✓ Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    {condition.advancePayment && (
                      <div className="advance-payment-tag">
                        Advance Payment: {condition.advanceAmount} {contractDetails.paymentTokenSymbol || 
                        (contractDetails.paymentToken !== "0x1111111111111111111111111111111111111111" ? 
                          contractDetails.paymentToken : "")}
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
                              <span className="icon">✓</span> Approve
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
                        Waiting for approval
                      </div>
                    )}
                    
                    {!canInteractWithCondition(condition, index) && !condition.completed && !condition.pendingApproval && (
                      <div className="condition-status-message">
                        Complete previous conditions first
                      </div>
                    )}
                    
                    {condition.completed && (
                      <div className="condition-status-message">
                        This condition has been approved
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
