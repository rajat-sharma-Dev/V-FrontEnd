import { ethers } from 'ethers';
import { createContractFromConfig } from './contractHelpers';
import { getContractDetails } from './escrowHelpers';

/**
 * Sets up WebSocket listeners for contract events
 * @param {Object} config Configuration object
 * @param {number} config.chainId Chain ID
 * @param {Object} config.networks Network configurations
 * @param {string} config.role User role ('seller' or 'buyer')
 * @param {string} config.account User account address
 * @param {ethers.Signer} config.signer Signer
 * @param {Function} config.onNewContract Callback for new contract events
 * @param {Function} config.onStatusChange Callback for status change events
 * @param {Function} config.onError Error handler
 * @returns {Function} Cleanup function to remove listeners
 */
export const setupContractEventListeners = ({
  chainId,
  networks,
  role,
  account,
  signer,
  onNewContract,
  onStatusChange,
  onError = console.error
}) => {
  if (!chainId || !account || !signer) {
    return () => {}; // Return empty cleanup function
  }
  
  try {
    // Set up WebSocket provider for real-time events
    let wsProvider;
    try {
      // This will need to be adjusted based on the available WebSocket endpoints for your networks
      const networkConfig = networks[chainId];
      if (networkConfig && networkConfig.wsUrl) {
        wsProvider = new ethers.WebSocketProvider(
          networkConfig.wsUrl,
          chainId
        );
        console.log(`WebSocket connection established to ${networkConfig.wsUrl}`);
      } else {
        console.warn(`No WebSocket URL configured for chain ${chainId}`);
        return () => {};
      }
    } catch (error) {
      console.error("Failed to connect WebSocket provider:", error);
      onError("WebSocket connection failed", error);
      return () => {};
    }
    
    // Create contract instances with WebSocket provider
    const factoryContract = createContractFromConfig('CONTRACT_FACTORY', chainId, wsProvider);
    if (!factoryContract) {
      console.error("Failed to create factory contract with WebSocket provider");
      return () => {};
    }
    
    console.log("Setting up contract event listeners...");
    
    // Handler for new contract events
    const handleNewContract = async (seller, buyer, contractAddress, event) => {
      console.log("New contract detected:", { seller, buyer, contractAddress });
      
      // Check if this contract is relevant to the user based on role
      const isRelevant = (role === 'seller' && seller.toLowerCase() === account.toLowerCase()) ||
                         (role === 'buyer' && buyer.toLowerCase() === account.toLowerCase());
      
      if (isRelevant) {
        try {
          // Create a contract instance with the user's signer
          const escrowContract = createContractFromConfig(
            'CONFIDENTIAL_ESCROW',
            chainId,
            signer,
            contractAddress
          );
          
          if (!escrowContract) {
            throw new Error(`Failed to create escrow contract instance for ${contractAddress}`);
          }
          
          // Get contract details
          const contractDetails = await getContractDetails(escrowContract);
          
          // Call the callback with the contract details
          if (typeof onNewContract === 'function') {
            onNewContract({
              ...contractDetails,
              timestamp: event.blockNumber ? Date.now() : Date.now() // Use block timestamp when available
            });
          }
          
          // Set up status change listener for this specific contract
          if (typeof onStatusChange === 'function') {
            setupStatusChangeListener(escrowContract, contractDetails, onStatusChange);
          }
        } catch (error) {
          console.error(`Error processing new contract ${contractAddress}:`, error);
          onError(`Failed to process new contract ${contractAddress}`, error);
        }
      }
    };
    
    // Set up the factory contract event listener
    console.log("Setting up ContractCreated event listener");
    
    // For future implementation when the factory contract has the event
    /*
    factoryContract.on('ContractCreated', handleNewContract);
    */
    
    // Return cleanup function
    return () => {
      console.log("Cleaning up WebSocket listeners");
      
      // Remove factory contract event listener
      /*
      if (factoryContract && factoryContract.removeListener) {
        factoryContract.removeListener('ContractCreated', handleNewContract);
      }
      */
      
      // Close WebSocket connection
      if (wsProvider && wsProvider.destroy) {
        wsProvider.destroy();
      }
    };
  } catch (error) {
    console.error("Error setting up contract event listeners:", error);
    onError("Failed to set up contract event listeners", error);
    return () => {};
  }
};

/**
 * Sets up a listener for contract status changes
 * @param {ethers.Contract} escrowContract The escrow contract instance
 * @param {Object} initialDetails Initial contract details
 * @param {Function} onStatusChange Callback for status changes
 */
const setupStatusChangeListener = (escrowContract, initialDetails, onStatusChange) => {
  if (!escrowContract || typeof onStatusChange !== 'function') return;
  
  try {
    // For future implementation when the escrow contract has the event
    /*
    const handleStatusChange = (oldStatus, newStatus, event) => {
      const statusMap = {
        0: 'pending',
        1: 'active',
        2: 'completed',
        3: 'disputed',
        4: 'refunded'
      };
      
      const oldStatusStr = statusMap[oldStatus] || 'unknown';
      const newStatusStr = statusMap[newStatus] || 'unknown';
      
      console.log(`Contract ${escrowContract.address} status changed: ${oldStatusStr} -> ${newStatusStr}`);
      
      onStatusChange({
        contractAddress: escrowContract.address,
        oldStatus: oldStatusStr,
        newStatus: newStatusStr,
        timestamp: Date.now(),
        transactionHash: event.transactionHash
      });
    };
    
    escrowContract.on('StatusChanged', handleStatusChange);
    */
  } catch (error) {
    console.error(`Error setting up status change listener for ${escrowContract.address}:`, error);
  }
};
