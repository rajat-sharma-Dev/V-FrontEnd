import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import { useWeb3 } from '../hooks/useWeb3';
import { getContractInfo } from "../config/contracts";
import { CONFIDENTIAL_ESCROW } from '../config/contractTypes';
import './InteractContract.css';
import confidentialEscrowAbi from '../contracts/ConfidentialEscrowABI.json';

const InteractContract = ({ contract }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [instance, setInstance] = useState(null);
  const [contractBuyer, setContractBuyer] = useState(null);
  const [contractSeller, setContractSeller] = useState(null);
  const [contractCondition, setContractCondition] = useState(null);
  const [contractState, setContractState] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { provider } = useWeb3();

  console.log("Contract prop received:", contract);

  // Use contract.contractAddress instead of contractAddress directly
  const loadContractDetails = async () => {
    try {
      // Make sure we have a contract address
      if (!contract || !contract.contractAddress) {
        throw new Error("No contract address provided");
      }
      
      const contractAddress = contract.contractAddress;
      console.log("Loading contract details for:", contractAddress);
      
      // Get actual network chain ID
      const { chainId } = await provider.getNetwork();
      
      // Use the contract type from props or default to CONFIDENTIAL_ESCROW
      const contractType = contract.contractType || CONFIDENTIAL_ESCROW;
      
      // Get contract configuration
      const contractConfig = getContractInfo(contractType, chainId.toString());
      console.log("Contract config retrieved:", {
        hasConfig: !!contractConfig,
        configType: contractConfig?.contractType,
        hasAbi: !!contractConfig?.abi,
        abiLength: contractConfig?.abi?.length
      });
      
      console.log("Creating new contract instance");
      const contractInstance = createContractFromConfig({
        contractType: contractType,
        chainId: chainId.toString(),
        contractAddress: contractAddress,
        contractConfig: contractConfig
      });
      
      if (!contractInstance) {
        throw new Error("Failed to create contract instance");
      }
      
      setInstance(contractInstance);
      
      // Log available methods to debug
      console.log("Available methods:", Object.keys(contractInstance.interface.functions));
      
      // Fetch contract state - using try/catch blocks for each method
      console.log("Fetching contract state");
      
      // Try to get buyer
      try {
        const buyer = await contractInstance.buyer();
        setContractBuyer(buyer);
      } catch (error) {
        console.log("Error fetching buyer:", error.message);
        // Try alternative method name
        try {
          const buyer = await contractInstance.getBuyer();
          setContractBuyer(buyer);
        } catch (innerError) {
          console.log("Alternative buyer method also failed:", innerError.message);
        }
      }
      
      // Try to get seller
      try {
        const seller = await contractInstance.seller();
        setContractSeller(seller);
      } catch (error) {
        console.log("Error fetching seller:", error.message);
        // Try alternative method name
        try {
          const seller = await contractInstance.getSeller();
          setContractSeller(seller);
        } catch (innerError) {
          console.log("Alternative seller method also failed:", innerError.message);
        }
      }
      
      // Try to get state
      try {
        const state = await contractInstance.state();
        setContractState(state);
        setIsComplete(state === 2);
      } catch (error) {
        console.log("Error fetching state:", error.message);
        // Try alternative method name
        try {
          const state = await contractInstance.getState();
          setContractState(state);
          setIsComplete(state === 2);
        } catch (innerError) {
          console.log("Alternative state method also failed:", innerError.message);
        }
      }
      
      // Try to get deposit
      try {
        const deposit = await contractInstance.deposit();
        setIsLocked(deposit > 0);
      } catch (error) {
        console.log("Error fetching deposit:", error.message);
        // Try alternative method name
        try {
          const deposit = await contractInstance.getDeposit();
          setIsLocked(deposit > 0);
        } catch (innerError) {
          console.log("Alternative deposit method also failed:", innerError.message);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.log("Error loading contract details:", error);
      setError(error.message);
      setLoading(false);
    }
  };

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
  
  // Handle deposit function
  const handleDeposit = async () => {
    if (!isConnected || !contractDetails || depositProcessing) return;
    
    setDepositProcessing(true);
    setError('');
    
    try {
      // Create contract instance
      const escrowContract = await createContractFromConfig(
        'CONFIDENTIAL_ESCROW',
        chainId,
        signer,
        contractDetails.contractAddress
      );
      
      if (!escrowContract) {
        throw new Error("Unable to connect to the contract");
      }
      
      // Get the token contract to approve the transfer
      const tokenAddress = contractDetails.tokenAddress;
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) public returns (bool)',
         'function allowance(address owner, address spender) public view returns (uint256)'],
        signer
      );
      
      // Get the total price as BigNumber
      const totalPrice = ethers.parseEther(contractDetails.price);
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(account, contractDetails.contractAddress);
      
      // If allowance is less than the needed amount, request approval
      if (currentAllowance < totalPrice) {
        console.log("Approving token transfer...");
        const approveTx = await tokenContract.approve(contractDetails.contractAddress, totalPrice);
        await approveTx.wait();
        console.log("Token transfer approved");
      }
      
      // Call deposit function on the contract
      console.log("Depositing funds...");
      const tx = await escrowContract.deposit();
      await tx.wait();
      
      console.log("Deposit successful");
      setIsDeposited(true);
      
      // Update the contract details to show deposit completed
      setContractDetails(prev => ({
        ...prev,
        isDeposited: true
      }));
      
    } catch (err) {
      console.error("Error making deposit:", err);
      setError(`Failed to deposit funds: ${err.message || "Unknown error"}`);
    } finally {
      setDepositProcessing(false);
    }
  };
  
  // Handle approving a condition
  const handleApproveCondition = async (conditionIndex) => {
    if (!isConnected || !contractDetails || processingAction) return;
    
    setSelectedCondition(conditionIndex);
    setActionType('approve');
    setProcessingAction(true);
    
    try {
      // Get the condition key from the title (hash of the title)
      const conditionTitle = contractDetails.conditions[conditionIndex].title;
      
      // Create contract instance
      const escrowContract = await createContractFromConfig(
        'CONFIDENTIAL_ESCROW',
        chainId,
        signer,
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
          approvedByBuyer: true
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
    
    // Cannot interact if funds have not been deposited
    if (!contractDetails.isDeposited) return false;
    
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
                  {contractDetails.contractAddress || "N/A"}
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
            </div>
          </div>
          
          {/* Deposit Section */}
          {contractDetails.buyerAddress.toLowerCase() === account.toLowerCase() && !contractDetails.isDeposited && (
            <div className="deposit-section">
              <div className="deposit-info">
                <div className="deposit-message">
                  <h3>Deposit Required</h3>
                  <p>You need to deposit funds to this contract before you or the seller can interact with conditions.</p>
                  <p className="deposit-amount">Amount: {contractDetails.price} {contractDetails.tokenSymbol}</p>
                </div>
                <button 
                  className="deposit-button" 
                  onClick={handleDeposit}
                  disabled={depositProcessing}
                >
                  {depositProcessing ? 'Processing...' : 'Deposit Funds'}
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>
          )}
          
          {/* Deposit Status */}
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
                      </>
                    ) : (
                      <div className="condition-status-message">
                        {condition.completed ? 
                          "This condition has been approved" : 
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
