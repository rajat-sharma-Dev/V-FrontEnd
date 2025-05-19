import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { createContractFromConfig, formatContractStatus, formatAddress } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import './ContractDetails.css';

const ContractDetails = ({ contract, onClose, userRole }) => {
  const { isConnected, account, chainId, signer } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedConditionIndex, setSelectedConditionIndex] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format address - use our imported formatter from utilities
  const formatAddressDisplay = formatAddress;
  
  // Handle condition select
  const handleConditionSelect = (index) => {
    setSelectedConditionIndex(index === selectedConditionIndex ? null : index);
  };
  
  // Handle approve condition
  const handleApproveCondition = async (conditionIndex) => {
    if (!isConnected) {
      setError("Please connect your wallet to approve conditions");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create contract instance
      const escrowContract = createContractFromConfig('CONFIDENTIAL_ESCROW', chainId, signer, contract.contractAddress);
      
      if (!escrowContract) {
        throw new Error("Unable to connect to the contract");
      }
      
      // Call approveCondition function on the contract
      const tx = await escrowContract.approveCondition(conditionIndex);
      await tx.wait();
      
      // Update the UI (in real app, you would fetch the updated contract state)
      // For now, we'll simulate the update
      
      // Get existing contracts from localStorage
      const existingContracts = localStorage.getItem('userContracts');
      if (existingContracts) {
        const contracts = JSON.parse(existingContracts);
        const contractIndex = contracts.findIndex(c => c.id === contract.id);
        
        if (contractIndex !== -1) {
          // Update the condition's approval status
          const updatedContract = {...contracts[contractIndex]};
          
          if (userRole === 'buyer') {
            updatedContract.conditions[conditionIndex].approvedByBuyer = true;
          } else if (userRole === 'seller') {
            updatedContract.conditions[conditionIndex].approvedBySeller = true;
          }
          
          // Check if all conditions are approved to update contract status
          const allConditionsApproved = updatedContract.conditions.every(c => 
            (userRole === 'buyer' ? c.approvedByBuyer : c.approvedBySeller)
          );
          
          if (allConditionsApproved) {
            updatedContract.status = 'completed';
          }
          
          contracts[contractIndex] = updatedContract;
          localStorage.setItem('userContracts', JSON.stringify(contracts));
          
          // Show success notification instead of reloading the page
          showNotification("Condition approved successfully!");
          
          // Refresh UI
          refreshContractData();
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error approving condition:", err);
      setError(err.message || "Failed to approve condition");
      setLoading(false);
    }
  };
  
  // Handle dispute creation
  const handleCreateDispute = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet to create a dispute");
      return;
    }
    
    if (!disputeReason.trim()) {
      setError("Please provide a reason for the dispute");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create contract instance
      const escrowContract = createContractFromConfig('CONFIDENTIAL_ESCROW', chainId, signer, contract.contractAddress);
      
      if (!escrowContract) {
        throw new Error("Unable to connect to the contract");
      }
      
      // Call dispute function on the contract
      const tx = await escrowContract.dispute(disputeReason);
      await tx.wait();
      
      // Update the UI (in real app, you would fetch the updated contract state)
      // For now, we'll simulate the update
      
      // Get existing contracts from localStorage
      const existingContracts = localStorage.getItem('userContracts');
      if (existingContracts) {
        const contracts = JSON.parse(existingContracts);
        const contractIndex = contracts.findIndex(c => c.id === contract.id);
        
        if (contractIndex !== -1) {
          // Update the contract status
          const updatedContract = {...contracts[contractIndex]};
          updatedContract.status = 'disputed';
          updatedContract.dispute = {
            reason: disputeReason,
            createdAt: new Date().toISOString(),
            votes: { buyer: 0, seller: 0 }
          };
          
          contracts[contractIndex] = updatedContract;
          localStorage.setItem('userContracts', JSON.stringify(contracts));
          
          // Show notification and refresh data instead of reloading
          showNotification("Dispute created successfully!");
          refreshContractData();
        }
      }
      
      setShowDisputeForm(false);
      setLoading(false);
    } catch (err) {
      console.error("Error creating dispute:", err);
      setError(err.message || "Failed to create dispute");
      setLoading(false);
    }
  };
  
  // Handle contract withdrawal
  const handleWithdraw = async () => {
    if (!isConnected) {
      setError("Please connect your wallet to withdraw funds");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create contract instance
      const escrowContract = createContractFromConfig('CONFIDENTIAL_ESCROW', chainId, signer, contract.contractAddress);
      
      if (!escrowContract) {
        throw new Error("Unable to connect to the contract");
      }
      
      // Call withdraw function on the contract
      const tx = await escrowContract.withdraw();
      await tx.wait();
      
      // Update the UI (in real app, you would fetch the updated contract state)
      // For now, we'll simulate the update
      showNotification("Funds withdrawn successfully!");
      
      setLoading(false);
    } catch (err) {
      console.error("Error withdrawing funds:", err);
      setError(err.message || "Failed to withdraw funds");
      setLoading(false);
    }
  };
  
  // Handle deposit to contract
  const handleDeposit = async () => {
    if (!isConnected) {
      setError("Please connect your wallet to deposit funds");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // In a real blockchain implementation, we would:
      // 1. Get contract instance
      const escrowContract = createContractFromConfig(
        'CONFIDENTIAL_ESCROW', 
        chainId, 
        signer, 
        contract.contractAddress
      );
      
      if (!escrowContract) {
        throw new Error("Unable to connect to the contract");
      }
      
      // 2. Determine required deposit amount
      // For demo, we'll use a fixed amount
      const depositAmount = ethers.parseEther("0.1");
      
      // 3. Execute deposit transaction
      // For native token deposits:
      // const tx = await escrowContract.deposit({ value: depositAmount });
      
      // For ERC20 token deposits, first approve then deposit:
      // const tokenContract = createContractInstance(contract.tokenAddress, ERC20_ABI, signer);
      // await tokenContract.approve(contract.contractAddress, depositAmount);
      // const tx = await escrowContract.depositERC20();
      
      // await tx.wait();
      
      // For demo purposes, simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 4. Update UI to reflect the deposit
      // This would happen automatically if we're refreshing contract state
      showNotification("Deposit successful!");
      
      // 5. Refresh contract data
      refreshContractData();
      
      setLoading(false);
    } catch (err) {
      console.error("Error depositing funds:", err);
      setError(err.message || "Failed to deposit funds");
      setLoading(false);
    }
  };
  
  // Get appropriate actions based on role and contract status
  const getActionButtons = () => {
    if (userRole === 'buyer') {
      if (contract.status === 'active') {
        return (
          <div className="contract-actions">              <div className="action-section">
              <h3>Buyer Actions</h3>
              <div className="action-buttons">
                <button 
                  onClick={() => handleApproveCondition(selectedConditionIndex)} 
                  disabled={loading || selectedConditionIndex === null}
                  className="btn-primary"
                >
                  {loading ? "Processing..." : "Approve Selected Condition"}
                </button>
                <button 
                  onClick={() => setShowDisputeForm(true)} 
                  disabled={loading}
                  className="btn-danger"
                >
                  Raise Dispute
                </button>
                <button 
                  onClick={handleDeposit} 
                  disabled={loading}
                  className="btn-secondary"
                >
                  Deposit Funds
                </button>
              </div>
            </div>
          </div>
        );
      } else if (contract.status === 'disputed') {
        return (
          <div className="contract-actions">
            <div className="action-info">
              <p>This contract is under dispute resolution. Please wait for validator votes.</p>
            </div>
          </div>
        );
      } else if (contract.status === 'completed') {
        return (
          <div className="contract-actions">
            <div className="action-info">
              <p>This contract has been completed successfully.</p>
            </div>
          </div>
        );
      }
    } else if (userRole === 'seller') {
      if (contract.status === 'active') {
        return (
          <div className="contract-actions">
            <div className="action-section">
              <h3>Seller Actions</h3>
              <div className="action-buttons">
                <button 
                  onClick={() => handleApproveCondition(selectedConditionIndex)} 
                  disabled={loading || selectedConditionIndex === null}
                  className="btn-primary"
                >
                  {loading ? "Processing..." : "Mark Selected Condition Complete"}
                </button>
                <button 
                  onClick={handleWithdraw} 
                  disabled={loading}
                  className="btn-success"
                >
                  {loading ? "Processing..." : "Withdraw Available Funds"}
                </button>
              </div>
            </div>
          </div>
        );
      } else if (contract.status === 'disputed') {
        return (
          <div className="contract-actions">
            <div className="action-info">
              <p>This contract is under dispute resolution. Please wait for validator votes.</p>
            </div>
          </div>
        );
      } else if (contract.status === 'completed') {
        return (
          <div className="contract-actions">
            <div className="action-section">
              <h3>Seller Actions</h3>
              <div className="action-buttons">
                <button 
                  onClick={handleWithdraw} 
                  disabled={loading}
                  className="btn-success"
                >
                  {loading ? "Processing..." : "Withdraw Final Payment"}
                </button>
              </div>
            </div>
          </div>
        );
      }
    } else if (userRole === 'validator') {
      if (contract.status === 'disputed') {
        return (
          <div className="contract-actions">
            <div className="action-section">
              <h3>Validator Actions</h3>
              <div className="action-buttons validator-vote-buttons">
                <button 
                  onClick={() => handleValidatorVote('buyer')} 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Processing..." : "Vote for Buyer"}
                </button>
                <button 
                  onClick={() => handleValidatorVote('seller')} 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Processing..." : "Vote for Seller"}
                </button>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="contract-actions">
            <div className="action-info">
              <p>This contract is not under dispute. No validator action required.</p>
            </div>
          </div>
        );
      }
    }
    
    return null;
  };
  
  // Handle validator vote
  const handleValidatorVote = async (voteFor) => {
    if (!isConnected) {
      setError("Please connect your wallet to vote");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create contract instance
      const escrowContract = createContractFromConfig('CONFIDENTIAL_ESCROW', chainId, signer, contract.contractAddress);
      
      if (!escrowContract) {
        throw new Error("Unable to connect to the contract");
      }
      
      // In a real blockchain implementation, we would call the contract's vote function
      // const tx = await escrowContract.vote(voteFor === 'buyer');
      // await tx.wait();
      
      // For demo purposes, simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get existing contracts from localStorage
      const existingContracts = localStorage.getItem('userContracts');
      if (existingContracts) {
        const contracts = JSON.parse(existingContracts);
        const contractIndex = contracts.findIndex(c => c.id === contract.id || c.contractAddress === contract.contractAddress);
        
        if (contractIndex !== -1) {
          // Update the vote count
          const updatedContract = {...contracts[contractIndex]};
          
          if (!updatedContract.dispute) {
            updatedContract.dispute = { votes: { buyer: 0, seller: 0 } };
          }
          
          if (voteFor === 'buyer') {
            updatedContract.dispute.votes.buyer += 1;
          } else {
            updatedContract.dispute.votes.seller += 1;
          }
          
          // If votes reach threshold, resolve dispute
          const buyerVotes = updatedContract.dispute.votes.buyer;
          const sellerVotes = updatedContract.dispute.votes.seller;
          
          if (buyerVotes >= 3 || sellerVotes >= 3) {
            updatedContract.status = buyerVotes > sellerVotes ? 'resolved_for_buyer' : 'resolved_for_seller';
          }
          
          contracts[contractIndex] = updatedContract;
          localStorage.setItem('userContracts', JSON.stringify(contracts));
          
          // Update the UI without page reload
          onClose(); // Close the modal
          
          // Show success message
          showNotification(`Vote for ${voteFor} recorded successfully!`);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError(err.message || "Failed to submit vote");
      setLoading(false);
    }
  };
  
  // Show notification message
  const showNotification = (message, type = 'success') => {
    // In a real implementation, you would use a toast notification library
    // For now, we'll use alert
    alert(message);
    
    // Log the action for reference
    console.log(`[${type.toUpperCase()}] ${message}`);
  };
  
  // Function to refresh contract data
  const refreshContractData = async () => {
    if (!isConnected || !contract || !contract.contractAddress) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create contract instance
      const escrowContract = createContractFromConfig(
        'CONFIDENTIAL_ESCROW', 
        chainId, 
        signer, 
        contract.contractAddress
      );
      
      if (escrowContract) {
        // In real blockchain integration, we would fetch updated contract data here
        // Example:
        /*
        // Use getContractInfo to get all basic info including status
        const contractInfo = await escrowContract.getContractInfo();
        const buyer = contractInfo[0]; // buyer is at index 0
        const seller = contractInfo[1]; // seller is at index 1
        const amount = contractInfo[2]; // total amount is at index 2
        const status = contractInfo[3]; // status is at index 3
        const conditionKeys = contractInfo[4]; // condition keys is at index 4
        
        // Update contract state with new data
        */
        
        console.log("Contract would be refreshed from blockchain:", contract.contractAddress);
      }
      
      // For now, get the latest from localStorage
      const storedContracts = localStorage.getItem('userContracts');
      if (storedContracts) {
        const contracts = JSON.parse(storedContracts);
        const updatedContract = contracts.find(
          c => c.id === contract.id || c.contractAddress === contract.contractAddress
        );
        
        if (updatedContract) {
          // This would trigger a re-render with the latest contract data
          // In a real implementation, we would update component state here
          console.log("Contract refreshed from storage:", updatedContract);
        }
      }
    } catch (err) {
      console.error("Error refreshing contract data:", err);
      setError("Failed to refresh contract data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh contract data when the component mounts
  useEffect(() => {
    refreshContractData();
    
    // Set up polling to refresh contract data (for demo purposes)
    const intervalId = setInterval(() => {
      refreshContractData();
    }, 30000); // Every 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.contractAddress, isConnected, chainId]);
  
  return (
    <div className="contract-details">
      <div className="details-header">
        <h2>Contract Details</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="details-content">
        <div className="details-section">
          <div className="detail-row">
            <span className="detail-label">Contract Status:</span>
            <span className={`detail-value status-badge status-${contract.status}`}>
              {formatContractStatus(contract.status)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Contract Address:</span>
            <span className="detail-value address-value">{contract.contractAddress || "N/A"}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Price:</span>
            <span className="detail-value">{contract.price} {contract.paymentTokenSymbol || 
              (contract.paymentToken !== "0x1111111111111111111111111111111111111111" ? 
                contract.paymentToken : "")}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Payment Token:</span>
            <span className="detail-value token-value">
              {contract.tokenSymbol || "Unknown Token"} 
              {contract.tokenAddress && (
                <span className="token-address-detail">
                  ({formatAddressDisplay(contract.tokenAddress)})
                </span>
              )}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Advance Payment:</span>
            <span className="detail-value">{contract.totalAdvancePayment} {contract.paymentTokenSymbol || 
              (contract.paymentToken !== "0x1111111111111111111111111111111111111111" ? 
                contract.paymentToken : "")}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Network:</span>
            <span className="detail-value network-value">
              {chainId === 8453 ? "Base Mainnet" : chainId === 84532 ? "Base Sepolia" : `Chain ID: ${chainId}`}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Buyer:</span>
            <span className="detail-value address-value">{formatAddress(contract.buyerAddress)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Seller:</span>
            <span className="detail-value address-value">{formatAddress(contract.sellerAddress)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{formatDate(contract.timestamp)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Deadline:</span>
            <span className="detail-value">{formatDate(contract.deadline)}</span>
          </div>
        </div>
        
        <div className="conditions-section">
          <h3>Conditions</h3>
          <div className="conditions-list">
            {contract.conditions.map((condition, index) => (
              <div 
                key={index} 
                className={`condition-item ${selectedConditionIndex === index ? 'selected' : ''} ${condition.completed ? 'completed' : ''}`}
                onClick={() => handleConditionSelect(index)}
              >
                <div className="condition-header">
                  <h4 className="condition-title">{condition.title}</h4>
                  <span className={`condition-status ${condition.completed ? 'completed' : 'pending'}`}>
                    {condition.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
                <p className="condition-description">{condition.description}</p>
                {condition.advancePayment && (
                  <div className="advance-payment-info">
                    <span>Advance Payment: {condition.advanceAmount} {contract.paymentTokenSymbol || 
                      (contract.paymentToken !== "0x1111111111111111111111111111111111111111" ? 
                        contract.paymentToken : "")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {contract.status === 'disputed' && contract.dispute && (
          <div className="dispute-section">
            <h3>Dispute Information</h3>
            <div className="dispute-details">
              <div className="detail-row">
                <span className="detail-label">Reason:</span>
                <span className="detail-value">{contract.dispute.reason}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Filed on:</span>
                <span className="detail-value">{formatDate(contract.dispute.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Buyer Votes:</span>
                <span className="detail-value">{contract.dispute.votes.buyer}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Seller Votes:</span>
                <span className="detail-value">{contract.dispute.votes.seller}</span>
              </div>
            </div>
          </div>
        )}
        
        {getActionButtons()}
        
        {showDisputeForm && (
          <div className="dispute-form-container">
            <h3>Create Dispute</h3>
            <form onSubmit={handleCreateDispute} className="dispute-form">
              <div className="form-group">
                <label htmlFor="disputeReason">Reason for Dispute:</label>
                <textarea
                  id="disputeReason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why you are disputing this contract..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn-danger" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Dispute"}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowDisputeForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDetails;
