import { ethers } from 'ethers';
import { 
  getContractAddress, 
  getContractABI, 
  getTokenAddress 
} from '../config/contracts';
import SwapAggregatorABI from '../contracts/SwapAggregatorABI.json';

/**
 * Create a contract instance
 * @param {string} contractAddress - The address of the contract
 * @param {Array} contractABI - The ABI of the contract
 * @param {ethers.Signer} signer - The signer
 * @returns {ethers.Contract} Contract instance
 */
export const createContractInstance = (contractAddress, contractABI, signer) => {
  return new ethers.Contract(contractAddress, contractABI, signer);
};

/**
 * Create a contract instance using configuration from contracts.js
 * @param {string} contractName - The name of the contract (e.g., "MARKETPLACE")
 * @param {number} chainId - The current chain ID
 * @param {ethers.Signer} signer - The signer
 * @param {string} [specificAddress] - Optional specific contract address to use instead of the default
 * @returns {ethers.Contract|null} Contract instance or null if configuration not found
 */
export const createContractFromConfig = (contractName, chainId, signer, specificAddress = null) => {
  if (!chainId) {
    console.error(`Cannot create contract instance: No chain ID provided`);
    return null;
  }
  
  if (!signer) {
    console.error(`Cannot create contract instance: No signer provided`);
    return null;
  }
  
  const address = specificAddress || getContractAddress(contractName, chainId);
  const abi = getContractABI(contractName);
  
  if (!address) {
    console.error(`Could not find address for ${contractName} on chain ID ${chainId}`);
    return null;
  }
  
  if (!abi) {
    console.error(`Could not find ABI for ${contractName}`);
    return null;
  }
  
  try {
    return createContractInstance(address, abi, signer);
  } catch (error) {
    console.error(`Error creating contract instance for ${contractName}:`, error);
    return null;
  }
};

/**
 * Create a token contract instance
 * @param {string} tokenSymbol - The symbol of the token (e.g., "USDC")
 * @param {number} chainId - The current chain ID
 * @param {ethers.Signer} signer - The signer
 * @returns {ethers.Contract|null} Token contract instance or null if configuration not found
 */
export const createTokenContract = (tokenSymbol, chainId, signer) => {
  const address = getTokenAddress(tokenSymbol, chainId);
  const abi = getContractABI("ERC20");
  
  if (!address || !abi) {
    console.error(`Could not create token contract instance for ${tokenSymbol}`);
    return null;
  }
  
  return createContractInstance(address, abi, signer);
};

/**
 * Create a SwapAggregator contract instance
 * @param {number} chainId - The current chain ID
 * @param {ethers.Signer} signer - The signer
 * @returns {ethers.Contract|null} SwapAggregator contract instance or null if configuration not found
 */
export const createSwapAggregatorContract = (chainId, signer) => {
  try {
    const address = getContractAddress("SWAP_AGGREGATOR", chainId);
    
    if (!address) {
      console.error(`Could not create SwapAggregator contract instance for chain ${chainId}: Address not found`);
      return null;
    }
    
    return createContractInstance(address, SwapAggregatorABI, signer);
  } catch (error) {
    console.error(`Error creating SwapAggregator contract:`, error);
    return null;
  }
};

/**
 * Sample function to interact with an ERC20 token
 * @param {ethers.Contract} contract - The contract instance
 * @returns {Promise<string>} Token symbol
 */
export const getTokenSymbol = async (contract) => {
  try {
    return await contract.symbol();
  } catch (error) {
    console.error('Error getting token symbol:', error);
    throw error;
  }
};

/**
 * Sample function to get token balance
 * @param {ethers.Contract} contract - The contract instance
 * @param {string} address - The address to check
 * @returns {Promise<string>} Token balance in ethers
 */
export const getTokenBalance = async (contract, address) => {
  try {
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
};

/**
 * Format contract status to a human-readable string
 * @param {string} status - Raw contract status
 * @returns {string} Formatted status string
 */
export const formatContractStatus = (status) => {
  if (!status) return 'Unknown';
  
  // Map of raw status values to human-readable strings
  const statusMap = {
    'active': 'Active',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'disputed': 'In Dispute',
    'resolved_for_buyer': 'Resolved for Buyer',
    'resolved_for_seller': 'Resolved for Seller',
    'pending': 'Pending Activation'
  };
  
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

/**
 * Format an Ethereum address for display
 * @param {string} address - The Ethereum address to format
 * @param {number} prefixLength - Number of characters to show at the beginning
 * @param {number} suffixLength - Number of characters to show at the end
 * @returns {string} Formatted address with ellipsis
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address) return 'N/A';
  if (address.length <= prefixLength + suffixLength) return address;
  
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};
