import { ethers } from "ethers";
import {
    getContractAddress,
    getContractABI,
    getTokenAddress,
    getContractInfo,
} from "../config/contracts";
import { CONTRACT_FACTORY } from "../config/contractTypes";
import SwapAggregatorABI from "../contracts/SwapAggregatorABI.json";

/**
 * Create a contract instance
 * @param {string} contractAddress - The address of the contract
 * @param {Array} contractABI - The ABI of the contract
 * @param {ethers.Signer} signer - The signer
 * @returns {ethers.Contract} Contract instance
 */
export const createContractInstance = (
    contractAddress,
    contractABI,
    signer
) => {
    return new ethers.Contract(contractAddress, contractABI, signer);
};

/**
 * Create a contract instance using configuration from contracts.js
 * @param {string} contractType - The type of the contract (e.g., "CONTRACT_FACTORY")
 * @param {number} chainId - The current chain ID
 * @param {ethers.Signer} signer - The signer
 * @param {string} [specificAddress] - Optional specific contract address to use instead of the default
 * @returns {ethers.Contract|null} Contract instance or null if configuration not found
 */
export const createContractFromConfig = async (
    contractType,
    chainId,
    signer,
    specificAddress
) => {
    try {
        // Validate inputs
        if (!contractType) {
            console.error("Missing contractType in createContractFromConfig");
            return null;
        }

        if (!signer) {
            console.error("Missing signer in createContractFromConfig");
            return null;
        }

        // Get contract info including ABI and address
        const contractInfo = getContractInfo(contractType, chainId);

        if (!contractInfo) {
            console.error(
                "Failed to get contract info for type:",
                contractType
            );
            return null;
        }

        // Use the specific address if provided, otherwise use the one from contract info
        const contractAddress = specificAddress || contractInfo?.address;

        console.log("Creating contract instance from config:", {
            contractType,
            chainId,
            contractAddress,
            contractConfig: contractInfo
                ? {
                      hasAbi: !!contractInfo.abi,
                      abiLength: contractInfo.abi ? contractInfo.abi.length : 0,
                  }
                : "No config",
        });

        // Check if we have the necessary data
        if (!contractAddress) {
            console.error(
                "Missing contract address for type:",
                contractInfo,
                "on chain:",
                chainId
            );
            return null;
        }

        if (!contractInfo || !contractInfo.abi) {
            console.error(
                "Missing contract ABI in config for type:",
                contractType
            );
            return null;
        }

        // Create contract instance
        console.log("Creating contract with:", {
            type: contractType,
            address: contractAddress,
            abiFirstItems: contractInfo.abi.slice(0, 2),
        });

        const contract = new ethers.Contract(
            contractAddress,
            contractInfo.abi,
            signer
        );

        console.log("Contract instance created successfully for", contractType);
        return contract;
    } catch (error) {
        console.error("Error creating contract instance:", error);
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
        console.error(
            `Could not create token contract instance for ${tokenSymbol}`
        );
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
            console.error(
                `Could not create SwapAggregator contract instance for chain ${chainId}: Address not found`
            );
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
        console.error("Error getting token symbol:", error);
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
        console.error("Error getting token balance:", error);
        throw error;
    }
};

/**
 * Format contract status to a human-readable string
 * @param {string} status - Raw contract status
 * @returns {string} Formatted status string
 */
export const formatContractStatus = (status) => {
    if (!status) return "Unknown";
    // Map of raw status values to human-readable strings
    const statusMap = {
        active: "Active",
        completed: "Completed",
        cancelled: "Cancelled",
        disputed: "In Dispute",
        resolved_for_buyer: "Resolved for Buyer",
        resolved_for_seller: "Resolved for Seller",
        pending: "Pending Activation",
    };
    return (
        statusMap[status.toLowerCase()] ||
        status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
    );
};

/**
 * Format an Ethereum address for display
 * @param {string} address - The Ethereum address to format
 * @param {number} prefixLength - Number of characters to show at the beginning
 * @param {number} suffixLength - Number of characters to show at the end
 * @returns {string} Formatted address with ellipsis
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
    if (!address) return "N/A";
    if (address.length <= prefixLength + suffixLength) return address;
    return `${address.substring(0, prefixLength)}...${address.substring(
        address.length - suffixLength
    )}`;
};
