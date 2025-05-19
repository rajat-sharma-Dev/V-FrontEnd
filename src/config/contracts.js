/**
 * Smart Contract Configuration
 *
 * This file contains the addresses, ABIs, and other configuration
 * needed for interacting with various smart contracts in the application.
 *
 * Update these values based on your deployed contracts and network.
 */

import { CONFIDENTIAL_ESCROW, CONTRACT_FACTORY, ERC20 } from "./contractTypes";
import ConfidentialEscrowABI from "../contracts/ConfidentialEscrowABI.json";
import FactoryABI from "../contracts/FactoryABI.json";
import { ERC20_ABI } from "../contracts/ERC20ABI";

// Define the CONTRACT_ABIS object and export it
export const CONTRACT_ABIS = {
    [CONFIDENTIAL_ESCROW]: ConfidentialEscrowABI.abi,
    [CONTRACT_FACTORY]: FactoryABI.abi,
    [ERC20]: ERC20_ABI,
};

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
    // Base Sepolia Testnet (Chain ID: 84532)
    84532: {
        [CONFIDENTIAL_ESCROW]: "", // This will be dynamically created by the factory
        [CONTRACT_FACTORY]: "0x8C62AE5a78Cd17a8853B906224D2c0af6953b697", // Your deployed Factory contract address
        [ERC20]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Your ERC20 token address on Base Sepolia
    },
    // Add other networks as needed
    // Example for Ethereum Mainnet:
    1: {
        [CONFIDENTIAL_ESCROW]: "",
        [CONTRACT_FACTORY]: "",
        [ERC20]: "",
    },
    // Example for Sepolia Testnet:
    11155111: {
        [CONFIDENTIAL_ESCROW]: "",
        [CONTRACT_FACTORY]: "",
        [ERC20]: "",
    },
};

// Get contract ABI
export function getContractABI(contractType) {
    return CONTRACT_ABIS[contractType];
}

// Get contract address for the specified network
export function getContractAddress(contractType, chainId) {
    // Ensure chainId is provided and is either a number or can be converted to a number
    if (!chainId) {
        console.error(`Invalid chainId provided: ${chainId}`);
        return null;
    }

    // If chainId is a hex address rather than a numeric chain ID, it's likely an error
    if (
        typeof chainId === "string" &&
        chainId.startsWith("0x") &&
        chainId.length === 42
    ) {
        console.error(
            `Received contract address (${chainId}) instead of chainId. This is likely an error.`
        );
        return null;
    }

    // Convert chainId to number to ensure consistent comparisons
    let chainIdNum;
    try {
        chainIdNum = Number(chainId);
        if (isNaN(chainIdNum)) {
            console.error(
                `Invalid chainId, cannot convert to number: ${chainId}`
            );
            return null;
        }
    } catch (error) {
        console.error(`Error converting chainId to number: ${error.message}`);
        return null;
    }

    // Check if the network exists in our config
    if (!CONTRACT_ADDRESSES[chainIdNum]) {
        console.error(
            `No contract addresses configured for chainId ${chainIdNum}`
        );
        return null;
    }

    // Special case for CONFIDENTIAL_ESCROW which is dynamically created
    if (contractType === CONFIDENTIAL_ESCROW) {
        // For CONFIDENTIAL_ESCROW, we don't need a static address since they're dynamically created
        // Return a special value to indicate this is a dynamic contract
        // In createContractFromConfig, we'll check for this value and use the specific address instead
        return (
            CONTRACT_ADDRESSES[chainIdNum][contractType] || "DYNAMIC_CONTRACT"
        );
    }

    // Check if the contract type exists for this network
    if (!CONTRACT_ADDRESSES[chainIdNum][contractType]) {
        console.error(
            `Contract type ${contractType} not configured for chainId ${chainIdNum}`
        );
        return null;
    }

    return CONTRACT_ADDRESSES[chainIdNum][contractType];
}

// Update the getContractInfo function to include proper error handling
export function getContractInfo(contractType, chainId) {
    if (!contractType) {
        console.warn("Missing contractType in getContractInfo");
        return null;
    }

    if (!chainId) {
        console.warn("Missing chainId in getContractInfo");
        return null;
    }

    // Convert contractType to string for comparison if it's an object
    const contractTypeKey =
        typeof contractType === "object" ? contractType.key : contractType;

    console.log(
        `Getting contract info for type: ${contractTypeKey} on chain: ${chainId}`
    );

    // Handle CONFIDENTIAL_ESCROW as a special case
    if (
        contractTypeKey === "CONFIDENTIAL_ESCROW" ||
        contractTypeKey === CONFIDENTIAL_ESCROW.key
    ) {
        return {
            contractType: CONFIDENTIAL_ESCROW,
            abi: confidentialEscrowAbi,
            address: null, // Address will be provided separately
        };
    }

    // For other contract types, use network config
    const networkConfig = CONTRACT_ADDRESSES[chainId];
    if (!networkConfig) {
        console.warn(`No contract addresses configured for chainId ${chainId}`);
        return null;
    }

    const contractConfig = networkConfig[contractTypeKey];
    if (!contractConfig) {
        console.warn(
            `No configuration found for contract type: ${contractTypeKey} on chain: ${chainId}`
        );
        return null;
    }

    return contractConfig;
}

// Add this function to export getTokenAddress
export function getTokenAddress(tokenSymbol, networkId = 1) {
    if (!CONTRACT_ADDRESSES[ERC20]) {
        return null;
    }

    // If there's a mapping by token symbol
    if (CONTRACT_ADDRESSES[ERC20][tokenSymbol]) {
        return CONTRACT_ADDRESSES[ERC20][tokenSymbol][networkId] || null;
    }

    // Default token address if no specific symbol is provided
    return CONTRACT_ADDRESSES[ERC20][networkId] || null;
}

// Define tokens directly in the file
export const tokens = {
    84532: [
        {
            name: "USDC",
            address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            decimals: 6,
            symbol: "USDC",
        },
        {
            name: "EURC",
            address: "0x08210f9170f89ab7658f0b5e3ff39b0e03c594d4",
            decimals: 6,
            symbol: "EURC",
        },
        {
            name: "Verdictor Token",
            address: "0x2805E68c9af7f4B0B2C9A2De1A216d4180817Ae8",
            decimals: 18,
            symbol: "VDT",
        },
    ],
    // Other chains...
};

export const getTokens = (chainId) => {
    // More robust error handling
    try {
        // Check if tokens is defined and has the chain ID as a property
        if (!tokens) {
            console.error("Tokens object is undefined");
            return [];
        }

        // If no chainId is provided, use the default
        const chainIdToUse = chainId || "84532"; // Default to Base Sepolia testnet

        if (!tokens[chainIdToUse]) {
            console.error(`No tokens found for chain ID ${chainIdToUse}`);
            return [];
        }

        return tokens[chainIdToUse];
    } catch (error) {
        console.error("Error in getTokens:", error);
        return [];
    }
};
