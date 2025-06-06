import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import { CONTRACT_ADDRESSES, tokens } from '../config/contracts';
import { CONTRACT_FACTORY } from '../config/contractTypes';
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
  const [availableTokens, setAvailableTokens] = useState([]);

  // Get available tokens based on the chain ID
  useEffect(() => {
    const getTokens = () => {
      if (!chainId) return [];
      
      const tokensArray = [];
      // Add native token (ETH) as first option
      tokensArray.push({ 
        symbol: 'Native Token (ETH)', 
        address: 'native' 
      });
      
      // Add tokens from contracts.js using the tokens object for the current chain
      try {
        const chainTokens = tokens[chainId] || [];
        chainTokens.forEach(token => {
          tokensArray.push({
            symbol: token.symbol,
            address: token.address
          });
        });
      } catch (error) {
        console.error("Error getting tokens for chain:", error);
      }
      
      return tokensArray;
    };
    
    const tokensForChain = getTokens();
    setAvailableTokens(tokensForChain);
    
    // If the current selected token is not available on this chain, reset to native
    if (paymentToken !== 'native' && !tokensForChain.find(t => t.address === paymentToken)) {
      setPaymentToken('native');
    }
  }, [chainId, paymentToken]);

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
    // Don't allow advance payments for conditions after the locked condition
    if (lockedConditionIndex !== null && index > lockedConditionIndex) {
      return;
    }
    
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
    } else {
      // Lock a new condition, unlocking the previous one if any
      setLockedConditionIndex(index);
      
      // If this condition is locked, we must disable advance payments on all subsequent conditions
      if (index < conditions.length - 1) {
        const newConditions = [...conditions];
        
        // Disable advance payments for all conditions after the locked one
        for (let i = index + 1; i < newConditions.length; i++) {
          if (newConditions[i].advancePayment) {
            newConditions[i] = {
              ...newConditions[i],
              advancePayment: false,
              advanceAmount: '0'
            };
          }
        }
        
        setConditions(newConditions);
      }
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
    
    // Lock condition is now optional
    
    try {
      setLoading(true);
      setError('');
      
      // Create contract instance
      const contractFactory = await createContractFromConfig(CONTRACT_FACTORY, chainId, signer);
      
      console.log("Contract Factory Instance:", contractFactory);
      
      // Check if contract instance was created
      if (!contractFactory) {
        console.error("Failed to create contract factory instance");
        setError("Contract factory not available on this network");
        setLoading(false);
        return;
      }
      
      // Log contract address and available methods
      console.log("Contract address:", contractFactory.target);
      
      // Check if the contract interface and functions are available
      if (contractFactory.interface) {
        const availableFunctions = contractFactory.interface.fragments
          .filter(fragment => fragment.type === 'function')
          .map(fragment => fragment.name);
        console.log("Available contract functions:", availableFunctions);
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
      
      // Get the token symbol
      const tokenSymbol = paymentToken === 'native' 
        ? 'ETH' 
        : availableTokens.find(t => t.address === paymentToken)?.symbol || '';
      
      console.log("Creating contract with params:", {
        seller: sellerAddress,
        buyer: account, // Current connected wallet
        amount: priceInWei.toString(),
        tokenAddress: tokenAddr,
        tokenSymbol,
        governor: governorAddress,
        conditions: contractConditions,
        deadline: deadlineInSeconds
      });
      
      // Create the contract using the Factory contract
      try {
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
      } catch (contractError) {
        console.error("Error calling createContract function:", contractError);
        setError(`Contract creation failed: ${contractError.message || "Unknown error"}`);
        setLoading(false);
        return;
      }
      
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
        paymentToken: tokenAddr,
        tokenAddress: tokenAddr,
        tokenSymbol: paymentToken === 'native' 
          ? 'ETH' 
          : availableTokens.find(t => t.address === paymentToken)?.symbol || '',
        paymentTokenSymbol: paymentToken === 'native' 
          ? 'ETH' 
          : availableTokens.find(t => t.address === paymentToken)?.symbol || '',
        deliveryDays,
        contractAddress,
        timestamp: Date.now(),
        status: 'pending',
        deadline: new Date(Date.now() + (deliveryDays * 86400 * 1000)).toISOString()
      };
      
      // No need to save to localStorage anymore as contracts will be fetched directly from the blockchain
      
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
                        disabled={isDisabled || isThisConditionLocked || 
                          (lockedConditionIndex !== null && index > lockedConditionIndex)}
                      />
                      <label htmlFor={`advance-checkbox-${index}`}>Advance Payment</label>
                      {lockedConditionIndex !== null && index > lockedConditionIndex && (
                        <span className="hint-text">
                          Advance payments not allowed after locked condition
                        </span>
                      )}
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
              {availableTokens.map((token, index) => (
                <option key={index} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className="field-helper">
              {chainId === 8453 
                ? "Select a payment token from Base Mainnet" 
                : chainId === 84532 
                  ? "Select a payment token from Base Sepolia testnet" 
                  : "Connect to a supported network to see available tokens"}
            </div>
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
