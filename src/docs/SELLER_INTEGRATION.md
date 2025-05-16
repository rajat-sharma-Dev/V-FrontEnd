# Seller Contracts Integration Guide

This document explains how the seller component works with the Factory contract to fetch and display contracts in the DApp.

## Overview

The MyContracts component has been enhanced to:

1. Fetch contracts where the current user is the seller
2. Display these contracts in a list view with seller-specific information
3. Support interaction with these contracts via the SellerInteractContract component
4. Provide fallback mechanisms when blockchain data isn't available

## Technical Implementation

### Contract Data Flow

1. **Factory Contract Integration**:
   - The Factory contract address is configured in `/src/config/contracts.js` for multiple networks
   - MyContracts component connects to this contract using `createContractFromConfig`
   - Once connected, it attempts to fetch seller contracts using helper functions

2. **Fetch Process**:
   - Helper functions in `escrowHelpers.js` are used to get contracts by seller address
   - For each contract address, an instance of the ConfidentialEscrow contract is created
   - Contract details (buyer, seller, amount, status, etc.) are fetched and formatted

3. **Fallback Mechanism**:
   - If blockchain fetching fails, the component uses localStorage data
   - If no saved data exists, mock contracts are generated for development
   - Errors are captured and displayed to the user with detailed messages

### Blockchain Functions

The current Factory contract ABI (`FactoryABI.json`) doesn't include methods for getting contracts by seller/buyer address. The code includes placeholders for when these functions are added:

```javascript
// This will work once the Factory contract is updated
const contractAddresses = await factoryContract.getSellerContracts(sellerAddress);
```

## Factory Contract Enhancement

The current Factory contract doesn't have methods to directly retrieve seller contracts. The following improvements are recommended:

### 1. Add Seller/Buyer Tracking Methods

```solidity
// Add mapping to track contracts by seller
mapping(address => address[]) private sellerContracts;
// Add mapping to track contracts by buyer
mapping(address => address[]) private buyerContracts;

// Update the createContract function to track relationships
function createContract(...) external returns (address) {
    // existing contract creation code
    address newContract = address(new ConfidentialEscrow(...));
    
    // Track the relationship
    sellerContracts[_seller].push(newContract);
    buyerContracts[_buyer].push(newContract);
    
    // Emit event
    emit ContractCreated(_seller, _buyer, newContract);
    
    return newContract;
}

// Add getter function for seller contracts
function getSellerContracts(address _seller) external view returns (address[] memory) {
    return sellerContracts[_seller];
}

// Add getter function for buyer contracts
function getBuyerContracts(address _buyer) external view returns (address[] memory) {
    return buyerContracts[_buyer];
}
```

### 2. Add Events for Contract Creation

```solidity
// Event for contract creation
event ContractCreated(
    address indexed seller,
    address indexed buyer,
    address contractAddress
);
```

### 3. Add Status Tracking and Filtering

```solidity
// Add mapping to track contract status
mapping(address => uint8) private contractStatus; // 0=pending, 1=active, 2=completed, 3=disputed, 4=refunded

// Add function to get contracts by status
function getContractsByStatus(address _user, bool _isSeller, uint8 _status) 
    external 
    view 
    returns (address[] memory) 
{
    address[] memory userContracts = _isSeller ? sellerContracts[_user] : buyerContracts[_user];
    
    // Count contracts with matching status
    uint256 count = 0;
    for (uint256 i = 0; i < userContracts.length; i++) {
        if (contractStatus[userContracts[i]] == _status) {
            count++;
        }
    }
    
    // Create result array
    address[] memory result = new address[](count);
    uint256 resultIndex = 0;
    
    // Fill result array
    for (uint256 i = 0; i < userContracts.length; i++) {
        if (contractStatus[userContracts[i]] == _status) {
            result[resultIndex] = userContracts[i];
            resultIndex++;
        }
    }
    
    return result;
}
```

## Future Improvements

The following improvements are recommended for future releases:

1. **Contract Event Handling**
   - Implement event listeners for real-time contract updates
   - Use WebSocket providers for continuous connectivity
   - Add notifications for important contract events

2. **Pagination and Filtering**
   - Implement server-side pagination for users with many contracts
   - Add advanced filtering options (date range, amount, status)
   - Add search functionality to find contracts quickly

3. **Data Synchronization**
   - Implement a more robust caching mechanism with expiration
   - Create background sync processes to keep data fresh
   - Add offline support with data reconciliation on reconnect

4. **UI Enhancements**
   - Add contract activity timeline view
   - Implement drag-and-drop file uploads for deliverables
   - Add export functionality for contract data (CSV, PDF)

For detailed implementation strategies for these features, see the [Advanced Features Documentation](/src/docs/ADVANCED_FEATURES.md).

## How to Use

### Integrating with New Factory Methods

When the Factory contract is updated with methods to get seller contracts, update `escrowHelpers.js`:

```javascript
export const getSellerContracts = async (factoryContract, sellerAddress, signer) => {
  // Replace this:
  return [];
  
  // With this:
  try {
    const contractAddresses = await factoryContract.getSellerContracts(sellerAddress);
    console.log(`Found ${contractAddresses.length} seller contracts`);
    return contractAddresses;
  } catch (error) {
    console.error("Error getting seller contracts:", error);
    throw error;
  }
};
```

### Testing with Real Data

To test with real contract data:

1. Deploy contracts to the Sepolia Base testnet
2. Create contracts with your address as the seller
3. Connect your wallet to the DApp
4. Navigate to the Seller dashboard and click "My Contracts"

### Debugging Contract Issues

For troubleshooting contract-related issues:

1. Check the browser console for detailed error messages
2. Verify contract addresses and ABIs in the configuration
3. Use `getContractDetails` to inspect individual contracts
4. Clear localStorage if you suspect cached data issues

## Troubleshooting

- **No Contracts Appear**: Check that your wallet is connected and you're on the correct network
- **Contract Actions Fail**: Verify the contract addresses are correct in the configuration
- **Contract Status Issues**: The status mappings are in `fetchContractsFromBlockchain` function
- **UI Displays Incorrectly**: Check that contract data includes all required fields

## Network Support

This implementation supports the following networks:
- Ethereum Mainnet (chainId: 1)
- Sepolia Testnet (chainId: 11155111)
- Sepolia Base Testnet (chainId: 84531) - Primarily used for testing
- Polygon Mainnet (chainId: 137)
- Mumbai Testnet (chainId: 80001)

## Role-Based Access

The component handles different roles (seller vs buyer) by:
1. Using different helper functions (`getSellerContracts` vs `getBuyerContracts`)
2. Storing data in role-specific localStorage keys
3. Displaying different UI elements and labels based on role
4. Loading the appropriate interaction component (SellerInteractContract vs InteractContract)

## Real-Time Contract Updates

To enable real-time updates as contracts are created and status changes occur, we've added WebSocket support through the new `contractEvents.js` helper:

```javascript
import { setupContractEventListeners } from '../utils/contractEvents';
import { NETWORKS } from '../config/contracts';

// In your component
useEffect(() => {
  if (!isConnected || !account || !signer || !chainId) return;
  
  // Set up handlers for contract events
  const handleNewContract = (contractDetails) => {
    console.log("New contract created:", contractDetails);
    setContracts(prev => [...prev, contractDetails]);
    
    // Update localStorage
    const storageKey = role === 'seller' ? 
      `seller-contracts-${account}` : 
      `buyer-contracts-${account}`;
    localStorage.setItem(storageKey, JSON.stringify([...contracts, contractDetails]));
  };
  
  const handleStatusChange = (statusDetails) => {
    console.log("Contract status changed:", statusDetails);
    
    // Update the contract in state
    setContracts(prev => prev.map(contract => {
      if (contract.contractAddress !== statusDetails.contractAddress) {
        return contract;
      }
      
      return {
        ...contract,
        status: statusDetails.newStatus
      };
    }));
  };
  
  const handleError = (message, error) => {
    console.error(message, error);
    // Optional: Show error notification to user
  };
  
  // Set up the WebSocket listeners
  const cleanup = setupContractEventListeners({
    chainId,
    networks: NETWORKS,
    role,
    account,
    signer,
    onNewContract: handleNewContract,
    onStatusChange: handleStatusChange,
    onError: handleError
  });
  
  // Clean up on component unmount
  return cleanup;
}, [isConnected, account, chainId, signer, role]);
```

### WebSocket Provider Configuration

For WebSocket functionality to work, ensure the networks are configured with WebSocket URLs:

```javascript
// In config/contracts.js
export const NETWORKS = {
  // Existing HTTP configuration
  SEPOLIA_BASE: {
    id: 84531,
    name: 'Sepolia Base Testnet',
    rpcUrl: 'https://sepolia.base.org',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.basescan.org',
    // Add WebSocket URL
    wsUrl: 'wss://sepolia.base.org/ws'
  },
  // Other networks...
};
```

### Implementation Notes

1. **WebSocket Availability**: Not all networks provide WebSocket endpoints. For those networks, the system will fall back to polling.

2. **Event Throttling**: To prevent overwhelming the UI with updates, events are throttled when multiple updates occur in rapid succession.

3. **Reconnection Logic**: WebSocket connections can be interrupted. The implementation includes automatic reconnection logic with exponential backoff.

4. **Data Consistency**: When updates arrive via WebSocket, they are merged with existing data to ensure consistency.

For full implementation details, see the [contractEvents.js](/src/utils/contractEvents.js) file.
