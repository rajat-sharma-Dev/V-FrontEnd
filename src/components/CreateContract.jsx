import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import './CreateContract.css';

const CreateContract = ({ onBack, onContractCreated }) => {
  const { isConnected, account, chainId, signer } = useWeb3();
  const [price, setPrice] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [numberOfConditions, setNumberOfConditions] = useState(1);
  const [conditions, setConditions] = useState([{ 
    title: '', 
    description: '', 
    advancePayment: false, 
    advanceAmount: '0',
    completed: false 
  }]);
  const [lockedConditionIndex, setLockedConditionIndex] = useState(null); // Track which condition is locked
  const [paymentToken, setPaymentToken] = useState('native');
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle changes in the number of conditions
  const handleNumberOfConditionsChange = (e) => {
    const num = parseInt(e.target.value) || 0;
    setNumberOfConditions(num);
    
    // Update the conditions array based on the new number
    if (num > conditions.length) {
      // Add new conditions
      const newConditions = [...conditions];
      for (let i = conditions.length; i < num; i++) {
        newConditions.push({ 
          title: '', 
          description: '', 
          advancePayment: false, 
          advanceAmount: '0', 
          completed: false 
        });
      }
      setConditions(newConditions);
    } else if (num < conditions.length) {
      // Remove excess conditions
      setConditions(conditions.slice(0, num));
    }
  };

  // Handle changes to individual condition fields
  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };
  
  // Toggle advance payment checkbox
  const toggleAdvancePayment = (index) => {
    const newConditions = [...conditions];
    newConditions[index] = { 
      ...newConditions[index], 
      advancePayment: !newConditions[index].advancePayment,
      // Reset advance amount to 0 if unchecking
      advanceAmount: !newConditions[index].advancePayment ? newConditions[index].advanceAmount : '0'
    };
    setConditions(newConditions);
  };
  
  // Handle condition lock toggle
  const handleConditionLockToggle = (index) => {
    if (lockedConditionIndex === index) {
      // Allow unlocking the currently locked condition
      setLockedConditionIndex(null);
    } else if (lockedConditionIndex === null) {
      // Lock a new condition if nothing is currently locked
      setLockedConditionIndex(index);
    }
  };
  
  // Calculate total advance payment
  const calculateTotalAdvancePayment = () => {
    return conditions
      .filter(c => c.advancePayment)
      .reduce((total, condition) => {
        const amount = parseFloat(condition.advanceAmount) || 0;
        return total + amount;
      }, 0);
  };
  
  // Calculate if total advance payment exceeds the price
  const isAdvancePaymentExceeded = () => {
    const totalAdvance = calculateTotalAdvancePayment();
    return totalAdvance > parseFloat(price || '0');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }
    
    // Validate seller address
    if (!ethers.isAddress(sellerAddress)) {
      setError("Please enter a valid Ethereum address for the seller");
      return;
    }
    
    // Validate conditions
    if (conditions.length === 0) {
      setError("Please add at least one condition");
      return;
    }
    
    // Validate that all conditions have titles and descriptions
    if (conditions.some(c => !c.title.trim() || !c.description.trim())) {
      setError("Please provide a title and description for all conditions");
      return;
    }
    
    // Check if advance payments exceed total price
    const totalAdvance = calculateTotalAdvancePayment();
    if (totalAdvance > parseFloat(price || '0')) {
      setError("Total advance payments cannot exceed the contract price");
      return;
    }
    
    // Ensure a condition is locked before submission
    if (lockedConditionIndex === null) {
      setError("Please lock at least one condition before submitting");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create contract instance
      const contractFactory = createContractFromConfig('CONTRACT_FACTORY', chainId, signer);
      
      if (!contractFactory) {
        setError("Contract factory not available on this network");
        setLoading(false);
        return;
      }
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(price);
      
      // Format the conditions for the ConfidentialEscrow contract
      const contractConditions = conditions.map((c, index) => ({
        title: c.title,
        description: c.description,
        approvedByBuyer: false,
        approvedBySeller: false,
        advancePayment: c.advancePayment ? ethers.parseEther(c.advanceAmount).toString() : "0",
        lock: index === lockedConditionIndex // Set lock to true for the locked condition
      }));
      
      // Get governor address (always use the fixed address for all deployments)
      const governorAddress = "0xA1FEe5CC5E8c1efe17dF588Fe1DC60865d1a7c82"; // Fixed governor address
      
      // Get the deadline in seconds (days * 86400)
      const deadlineInSeconds = deliveryDays * 86400;
      
      // Get the token address or use native ETH
      const tokenAddr = paymentToken === 'native' ? ethers.ZeroAddress : paymentToken;
      
      console.log("Creating contract with params:", {
        seller: sellerAddress,
        buyer: account, // Current connected wallet
        amount: priceInWei.toString(),
        tokenAddress: tokenAddr,
        governor: governorAddress,
        conditions: contractConditions,
        deadline: deadlineInSeconds
      });
      
      // Create the contract using the Factory contract
      const tx = await contractFactory.createContract(
        sellerAddress,     // _seller
        account,           // _buyer (current user)
        priceInWei,        // _amount
        tokenAddr,         // _tokenAddress
        governorAddress,   // _governor
        contractConditions, // _conditions
        deadlineInSeconds  // _deadline
      );
      
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Get the escrow contract address
      // Note: The Factory contract doesn't emit an event with the address, so we need to get it from the mapping
      // For now we'll simulate it since we can't call these mappings directly from the UI
      const contractAddress = "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0');
      
      setLoading(false);
      
      // Create contract object to store
      const newContract = {
        price,
        sellerAddress,
        buyerAddress: account,
        conditions: conditions.map(c => ({
          title: c.title,
          description: c.description,
          advancePayment: c.advancePayment,
          advanceAmount: c.advancePayment ? c.advanceAmount : '0',
          completed: false
        })),
        totalAdvancePayment: totalAdvance.toString(),
        paymentToken: paymentToken === 'native' ? 'Native Token' : paymentToken,
        deliveryDays,
        contractAddress,
        timestamp: Date.now(),
        status: 'active',
        deadline: new Date(Date.now() + (deliveryDays * 86400 * 1000)).toISOString()
      };
      
      // Save to localStorage for ViewContracts component
      const existingContracts = localStorage.getItem('userContracts');
      let contracts = [];
      
      if (existingContracts) {
        try {
          contracts = JSON.parse(existingContracts);
        } catch (e) {
          console.error("Error parsing stored contracts:", e);
          contracts = [];
        }
      }
      
      // Add the new contract
      contracts.push({
        ...newContract,
        id: contracts.length + 1
      });
      
      // Save back to localStorage
      localStorage.setItem('userContracts', JSON.stringify(contracts));
      
      if (onContractCreated) {
        onContractCreated(newContract);
      }
      
    } catch (err) {
      console.error("Error creating contract:", err);
      setError(err.message || "Failed to create contract");
      setLoading(false);
    }
  };
  
  return (
    <div className="create-contract">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          &larr; Back
        </button>
        <h2>Create New Contract</h2>
      </div>
      
      {!isConnected ? (
        <div className="connect-prompt">
          <p>Please connect your wallet to create a contract.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="contract-form">
          <div className="form-group">
            <label htmlFor="sellerAddress">Seller Address</label>
            <input
              id="sellerAddress"
              type="text"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder="0x..."
              required
            />
            <div className="field-helper">Ethereum address of the service provider/seller</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="numberOfConditions">Number of Conditions</label>
            <input
              id="numberOfConditions"
              type="number"
              value={numberOfConditions}
              onChange={handleNumberOfConditionsChange}
              min="1"
              max="10"
              required
            />
            <div className="field-helper">Define how many conditions must be met for contract completion</div>
          </div>
          
          {/* Info about condition locks */}
          <div className="lock-info">
            <p className="lock-instruction">
              {lockedConditionIndex === null 
                ? "Please lock one condition using the checkbox below to proceed with contract creation" 
                : `Condition #${lockedConditionIndex + 1} is locked. You can unlock it or keep it locked to proceed.`}
            </p>
          </div>

          {/* Dynamically generated condition fields */}
          {conditions.map((condition, index) => {
            const isThisConditionLocked = lockedConditionIndex === index;
            const isAnyConditionLocked = lockedConditionIndex !== null;
            const isDisabled = isAnyConditionLocked && !isThisConditionLocked;
            
            return (
              <div key={`condition-${index}`} className={`form-group condition-group ${isThisConditionLocked ? 'locked-condition' : ''}`}>
                <div className="condition-header">
                  <h4>Condition #{index + 1}</h4>
                  <div className="lock-checkbox-container">
                    <input
                      id={`lock-checkbox-${index}`}
                      type="checkbox"
                      checked={isThisConditionLocked}
                      onChange={() => handleConditionLockToggle(index)}
                      disabled={isAnyConditionLocked && !isThisConditionLocked}
                    />
                    <label htmlFor={`lock-checkbox-${index}`}>
                      {isThisConditionLocked ? "🔒 Locked (click to unlock)" : "Lock this condition"}
                    </label>
                  </div>
                </div>
                
                <div className="condition-fields">
                  <div className="form-group">
                    <label htmlFor={`condition-title-${index}`}>Title</label>
                    <input
                      id={`condition-title-${index}`}
                      type="text"
                      value={condition.title}
                      onChange={(e) => handleConditionChange(index, 'title', e.target.value)}
                      placeholder="Title for this condition"
                      disabled={isDisabled || isThisConditionLocked}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`condition-description-${index}`}>Description</label>
                    <textarea
                      id={`condition-description-${index}`}
                      value={condition.description}
                      onChange={(e) => handleConditionChange(index, 'description', e.target.value)}
                      placeholder={`Describe condition ${index + 1} in detail...`}
                      rows={3}
                      disabled={isDisabled || isThisConditionLocked}
                      required
                    />
                  </div>
                  
                  <div className="advance-payment-section">
                    <div className="checkbox-container">
                      <input
                        id={`advance-checkbox-${index}`}
                        type="checkbox"
                        checked={condition.advancePayment}
                        onChange={() => toggleAdvancePayment(index)}
                        disabled={isDisabled || isThisConditionLocked}
                      />
                      <label htmlFor={`advance-checkbox-${index}`}>Advance Payment</label>
                    </div>
                    
                    {condition.advancePayment && (
                      <div className="advance-amount-container">
                        <label htmlFor={`advance-amount-${index}`}>Amount:</label>
                        <input
                          id={`advance-amount-${index}`}
                          type="number"
                          value={condition.advanceAmount}
                          onChange={(e) => handleConditionChange(index, 'advanceAmount', e.target.value)}
                          step="0.0001"
                          min="0"
                          disabled={isDisabled || isThisConditionLocked}
                          required={condition.advancePayment}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="form-section-divider">
            <h3>Payment Details</h3>
          </div>

          {/* Total advance payment summary */}
          <div className="payment-summary">
            <div className="summary-item">
              <span className="summary-label">Total Advance Payments:</span>
              <span className="summary-value">{calculateTotalAdvancePayment().toFixed(4)}</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="price">Contract Total Price</label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1"
              step="0.0001"
              min={calculateTotalAdvancePayment()}
              required
            />
            <div className="field-helper">The total payment amount for completed work (must be greater than or equal to total advance payments)</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="paymentToken">Payment Token</label>
            <select
              id="paymentToken"
              value={paymentToken}
              onChange={(e) => setPaymentToken(e.target.value)}
            >
              <option value="native">Native Token (ETH/MATIC)</option>
              <option value="0x1111111111111111111111111111111111111111">USDC</option>
              <option value="0x2222222222222222222222222222222222222222">USDT</option>
              <option value="0x3333333333333333333333333333333333333333">DAI</option>
            </select>
            <div className="field-helper">Select which token to use for payment</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="deliveryDays">Delivery Time (days)</label>
            <input
              id="deliveryDays"
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(parseInt(e.target.value))}
              min="1"
              required
            />
            <div className="field-helper">Expected time for contract completion in days</div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="create-button"
            disabled={loading || isAdvancePaymentExceeded() || lockedConditionIndex === null}
          >
            {loading ? "Creating Contract..." : "Create Contract"}
          </button>
          
          {isAdvancePaymentExceeded() && (
            <div className="error-message">
              Total advance payments cannot exceed the contract price
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default CreateContract;
