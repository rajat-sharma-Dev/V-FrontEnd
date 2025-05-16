# Smart Contract Integration Guide

This document explains how to use the smart contract configuration in your frontend application.

## Contract Config File

The main contract configuration is located at `src/config/contracts.js`. This file contains:

- Network configurations
- Smart contract addresses for different networks
- Smart contract ABIs
- Helper functions for getting addresses and ABIs

## How to Update Contract Addresses

When you deploy your smart contracts to different networks, update the addresses in the `CONTRACT_ADDRESSES` object:

```javascript
export const CONTRACT_ADDRESSES = {
  // Main marketplace contract
  MARKETPLACE: {
    1: '0x...', // Ethereum Mainnet
    11155111: '0x...', // Sepolia
    // other networks...
  },
  // other contracts...
};
```

## How to Add New ABIs

When you create a new smart contract, add its ABI to the `CONTRACT_ABIS` object:

1. Import the ABI from a separate file or define it inline
2. Add it to the object with a descriptive key

```javascript
export const CONTRACT_ABIS = {
  // Existing ABIs...
  
  // Add your new ABI
  MY_NEW_CONTRACT: [
    // Your contract ABI here
  ]
};
```

## How to Use in Components

### Creating Contract Instances

Use the helper functions from `contractHelpers.js` to create contract instances:

```javascript
import { createContractFromConfig } from '../utils/contractHelpers';
import { useWeb3 } from '../hooks/useWeb3';

function MyComponent() {
  const { isConnected, chainId, signer } = useWeb3();
  const [myContract, setMyContract] = useState(null);
  
  useEffect(() => {
    if (isConnected && chainId && signer) {
      // Create contract instance from config
      const contract = createContractFromConfig('MARKETPLACE', chainId, signer);
      setMyContract(contract);
    }
  }, [isConnected, chainId, signer]);
  
  // Now you can use myContract.someFunction() for interactions
}
```

### Working with Tokens

For token-related functionality:

```javascript
import { createTokenContract } from '../utils/contractHelpers';

// Create an instance of USDC token
const usdcContract = createTokenContract('USDC', chainId, signer);

// Now you can use usdcContract.balanceOf(), etc.
```

## Adding a New Smart Contract

1. Deploy your contract and get the address
2. Add the address to `CONTRACT_ADDRESSES` in `contracts.js`
3. Add the ABI to `CONTRACT_ABIS` in `contracts.js`
4. Use `createContractFromConfig` in your components

## Networks

The configuration includes support for:
- Ethereum Mainnet (chainId: 1)
- Sepolia Testnet (chainId: 11155111)
- Sepolia Base Testnet (chainId: 84531)
- Polygon Mainnet (chainId: 137)
- Mumbai Testnet (chainId: 80001)

To add more networks, update the `NETWORKS` object in `contracts.js`.
