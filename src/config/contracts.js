/**
 * Smart Contract Configuration
 * 
 * This file contains the addresses, ABIs, and other configuration
 * needed for interacting with various smart contracts in the application.
 * 
 * Update these values based on your deployed contracts and network.
 */

import { ERC20_ABI } from '../contracts/ERC20ABI';
import ConfidentialEscrowABI from '../contracts/ConfidentialEscrowABI.json';
import EncryptedVaultABI from '../contracts/EncryptedVaultABI.json';
import FactoryABI from '../contracts/FactoryABI.json';

// Network Configuration
export const NETWORKS = {
  ETHEREUM_MAINNET: {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY', // Replace with your Infura key
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io'
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Replace with your Infura key
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  SEPOLIA_BASE: {
    id: 84531,
    name: 'Sepolia Base Testnet',
    rpcUrl: 'https://sepolia.base.org',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.basescan.org'
  },
  POLYGON: {
    id: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com'
  },
  MUMBAI: {
    id: 80001,
    name: 'Mumbai Testnet',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    symbol: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com'
  }
};

// Default network
export const DEFAULT_NETWORK = NETWORKS.ETHEREUM_MAINNET;

// Smart Contract Addresses
// Replace these placeholder addresses with your actual deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // Main marketplace contract
  MARKETPLACE: {
    1: '0x1234567890123456789012345678901234567890', // Ethereum Mainnet
    11155111: '0x1234567890123456789012345678901234567890', // Sepolia
    137: '0x1234567890123456789012345678901234567890', // Polygon
    80001: '0x1234567890123456789012345678901234567890' // Mumbai
  },
  
  // Buyer contract
  BUYER: {
    1: '0x2345678901234567890123456789012345678901',
    11155111: '0x2345678901234567890123456789012345678901',
    137: '0x2345678901234567890123456789012345678901',
    80001: '0x2345678901234567890123456789012345678901'
  },
  
  // Seller contract
  SELLER: {
    1: '0x3456789012345678901234567890123456789012',
    11155111: '0x3456789012345678901234567890123456789012',
    137: '0x3456789012345678901234567890123456789012',
    80001: '0x3456789012345678901234567890123456789012'
  },
  
  // Validator contract
  VALIDATOR: {
    1: '0x4567890123456789012345678901234567890123',
    11155111: '0x4567890123456789012345678901234567890123',
    137: '0x4567890123456789012345678901234567890123',
    80001: '0x4567890123456789012345678901234567890123'
  },
  
  // Swap Aggregator contract
  SWAP_AGGREGATOR: {
    1: '0x5678901234567890123456789012345678901234', // Ethereum Mainnet
    11155111: '0x5678901234567890123456789012345678901234', // Sepolia
    137: '0x5678901234567890123456789012345678901234', // Polygon
    80001: '0x5678901234567890123456789012345678901234' // Mumbai
  },
  
  // Token swap contract
  SWAP: {
    1: '0x5678901234567890123456789012345678901234',
    11155111: '0x5678901234567890123456789012345678901234',
    137: '0x5678901234567890123456789012345678901234',
    80001: '0x5678901234567890123456789012345678901234'
  },
  
  // Contract Factory for ConfidentialEscrow
  CONTRACT_FACTORY: {
    1: '0x6789012345678901234567890123456789012345',
    11155111: '0x6789012345678901234567890123456789012345',
    137: '0x6789012345678901234567890123456789012345',
    80001: '0x6789012345678901234567890123456789012345',
    84532: '0xB92596471F1652F33fA09809fA16fB6660E6cF71' // Sepolia Base Testnet
  },
  
  // Popular token addresses
  TOKENS: {
    // Ethereum Mainnet
    1: {
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    },
    // Sepolia
    11155111: {
      WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Example - replace with actual
      USDC: '0xda9d4f9b69ac6C22e444eD9aF0CfC043b7a7f53f', // Example - replace with actual
    },
    // Polygon
    137: {
      WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
    },
    // Mumbai
    80001: {
      WMATIC: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889', // Example - replace with actual
      USDC: '0xe11A86849d99F524cAC3E7A0Ec1241828e332C62'  // Example - replace with actual
    }
  }
};

// Smart Contract ABIs
export const CONTRACT_ABIS = {
  // Import your ABIs here or define them inline
  ERC20: ERC20_ABI,
  CONFIDENTIAL_ESCROW: ConfidentialEscrowABI.abi,
  ENCRYPTED_VAULT: EncryptedVaultABI.abi,
  CONTRACT_FACTORY: FactoryABI.abi,
  
  // Example Marketplace ABI - Replace with your actual ABI
  MARKETPLACE: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_token",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "itemId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "ItemListed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "itemId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "ItemSold",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_itemId",
          "type": "uint256"
        }
      ],
      "name": "buyItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getItemCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_itemId",
          "type": "uint256"
        }
      ],
      "name": "getItemDetails",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "sold",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_price",
          "type": "uint256"
        }
      ],
      "name": "listItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  
  // Validator contract ABI - Replace with your actual ABI
  VALIDATOR: [
    {
      "inputs": [],
      "name": "stake",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unstake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_validator",
          "type": "address"
        }
      ],
      "name": "getValidatorInfo",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "stakedAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rewards",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "joinedTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  
  // Add other contract ABIs as needed
};

/**
 * Helper function to get a contract address for the current network
 * @param {string} contractName - The name of the contract (key in CONTRACT_ADDRESSES)
 * @param {number} chainId - The current chain ID
 * @returns {string|null} The contract address or null if not found
 */
export const getContractAddress = (contractName, chainId) => {
  if (CONTRACT_ADDRESSES[contractName] && CONTRACT_ADDRESSES[contractName][chainId]) {
    return CONTRACT_ADDRESSES[contractName][chainId];
  }
  console.error(`No address found for ${contractName} on chain ID ${chainId}`);
  return null;
};

/**
 * Helper function to get a token address for the current network
 * @param {string} tokenSymbol - The symbol of the token (e.g., "USDC")
 * @param {number} chainId - The current chain ID
 * @returns {string|null} The token address or null if not found
 */
export const getTokenAddress = (tokenSymbol, chainId) => {
  if (CONTRACT_ADDRESSES.TOKENS[chainId] && CONTRACT_ADDRESSES.TOKENS[chainId][tokenSymbol]) {
    return CONTRACT_ADDRESSES.TOKENS[chainId][tokenSymbol];
  }
  console.error(`No address found for token ${tokenSymbol} on chain ID ${chainId}`);
  return null;
};

/**
 * Helper function to get an ABI by contract name
 * @param {string} contractName - The name of the contract (key in CONTRACT_ABIS)
 * @returns {Array|null} The contract ABI or null if not found
 */
export const getContractABI = (contractName) => {
  if (CONTRACT_ABIS[contractName]) {
    return CONTRACT_ABIS[contractName];
  }
  console.error(`No ABI found for ${contractName}`);
  return null;
};
