/**
 * Token List Configuration
 *
 * This file contains configurations for tokens supported in the swap interface.
 * Each token includes:
 * - symbol: The token symbol (e.g., "ETH", "USDT")
 * - name: The full token name (e.g., "Ethereum", "Tether USD")
 * - decimals: The number of decimals used by the token
 * - logo: Path to the token logo (relative to /public/tokens/)
 * - addresses: Contract addresses on different networks
 */

const TOKEN_LIST = {
    // Native Blockchain Tokens
    ETH: {
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        logo: "/tokens/eth.png",
        addresses: {
            8453: "NATIVE", // Base Mainnet - ETH is native
            84532: "NATIVE", // Base Sepolia - ETH is native
        },
        isNative: true,
    },

    // Wrapped Native Tokens
    WETH: {
        symbol: "WETH",
        name: "Wrapped Ethereum",
        decimals: 18,
        logo: "/tokens/weth.png",
        addresses: {
            1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Mainnet
            11155111: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // Sepolia
            84531: "0x4200000000000000000000000000000000000006", // Base Sepolia (standard WETH address on Base)
            137: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // Polygon Mainnet (WETH on Polygon)
            80001: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", // Mumbai
        },
    },
    WMATIC: {
        symbol: "WMATIC",
        name: "Wrapped Matic",
        decimals: 18,
        logo: "/tokens/wmatic.png",
        addresses: {
            137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // Polygon Mainnet
            80001: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889", // Mumbai
        },
    },

    // Stablecoins
    USDT: {
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logo: "/tokens/usdt.png",
        addresses: {
            1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Mainnet
            11155111: "0x07889337e7699a081cfe716c79af13ceb9fac53f", // Sepolia
            84531: "0x783349cd983f1ebcD2CA5727320E2eF11B79A8cd", // Sepolia Base
            137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon Mainnet
            80001: "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832", // Mumbai
        },
    },
    USDC: {
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logo: "/tokens/usdc.png",
        addresses: {
            1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet
            11155111: "0xda9d4f9b69ac6C22e444eD9aF0CfC043b7a7f53f", // Sepolia
            84531: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Sepolia Base
            137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon Mainnet
            80001: "0xe11A86849d99F524cAC3E7A0Ec1241828e332C62", // Mumbai
        },
    },
    DAI: {
        symbol: "DAI",
        name: "Dai Stablecoin",
        decimals: 18,
        logo: "/tokens/dai.png",
        addresses: {
            1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Mainnet
            11155111: "0x8551fd9c5d30ee9584e1b75d89ca4f975d1865d0", // Sepolia
            84531: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // Sepolia Base
            137: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // Polygon Mainnet
            80001: "0xF14f9596430931E177469715c591513308244e8F", // Mumbai
        },
    },

    // Other Popular Tokens
    WBTC: {
        symbol: "WBTC",
        name: "Wrapped Bitcoin",
        decimals: 8,
        logo: "/tokens/wbtc.png",
        addresses: {
            1: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // Mainnet
            11155111: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // Sepolia
            137: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // Polygon Mainnet
            80001: "0x0d787a4a1548f673ed375445535a6c7A1EE56180", // Mumbai
        },
    },
    LINK: {
        symbol: "LINK",
        name: "Chainlink",
        decimals: 18,
        logo: "/tokens/link.png",
        addresses: {
            1: "0x514910771AF9Ca656af840dff83E8264EcF986CA", // Mainnet
            11155111: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Sepolia
            84531: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410", // Sepolia Base
            137: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", // Polygon Mainnet
            80001: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", // Mumbai
        },
    },
    UNI: {
        symbol: "UNI",
        name: "Uniswap",
        decimals: 18,
        logo: "/tokens/uni.png",
        addresses: {
            1: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // Mainnet
            11155111: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // Sepolia
            137: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f", // Polygon Mainnet
            80001: "0x9e1dE3a1E22DD36FD5ac4a875E1DDe6F31103823", // Mumbai
        },
    },
    // Custom protocol token
    CDT: {
        symbol: "CDT",
        name: "Custom Decentralized Token",
        decimals: 18,
        logo: "/tokens/eth.png", // Use ETH logo as placeholder
        addresses: {
            1: "0xCDC1111111111111111111111111111111111CDC", // Placeholder for Mainnet
            11155111: "0xCDC2222222222222222222222222222222222CDC", // Placeholder for Sepolia
            84531: "0xCDC5555555555555555555555555555555555CDC", // Placeholder for Sepolia Base
            137: "0xCDC3333333333333333333333333333333333CDC", // Placeholder for Polygon
            80001: "0xCDC4444444444444444444444444444444444CDC", // Placeholder for Mumbai
        },
    },

    AAVE: {
        symbol: "AAVE",
        name: "Aave",
        decimals: 18,
        logo: "/tokens/aave.png",
        addresses: {
            1: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", // Mainnet
            137: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B", // Polygon Mainnet
        },
    },
    SUSHI: {
        symbol: "SUSHI",
        name: "SushiSwap",
        decimals: 18,
        logo: "/tokens/sushi.png",
        addresses: {
            1: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", // Mainnet
            137: "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a", // Polygon Mainnet
        },
    },
};

/**
 * Get all supported tokens for a specific chain ID
 * @param {number} chainId - The chain ID
 * @returns {Array} Array of token objects supported on the specified chain
 */
export const getSupportedTokens = (chainId) => {
    if (!chainId) return [];

    return Object.values(TOKEN_LIST).filter(
        (token) => token.addresses && token.addresses[chainId]
    );
};

/**
 * Get token info by symbol
 * @param {string} symbol - Token symbol (e.g., "ETH", "USDT")
 * @returns {Object|null} Token info or null if not found
 */
export const getTokenBySymbol = (symbol) => {
    return TOKEN_LIST[symbol] || null;
};

/**
 * Get token address on a specific network
 * @param {string} symbol - Token symbol
 * @param {number} chainId - The chain ID
 * @returns {string|null} Token address or null if not available
 */
export const getTokenAddress = (symbol, chainId) => {
    const token = TOKEN_LIST[symbol];
    if (!token || !token.addresses || !token.addresses[chainId]) {
        return null;
    }
    return token.addresses[chainId];
};

/**
 * Check if a token is native to the blockchain (ETH, MATIC, etc.)
 * @param {string} symbol - Token symbol
 * @param {number} chainId - The chain ID
 * @returns {boolean} True if the token is native
 */
export const isNativeToken = (symbol, chainId) => {
    const token = TOKEN_LIST[symbol];
    if (!token || !token.addresses || !token.addresses[chainId]) {
        return false;
    }
    return token.addresses[chainId] === "NATIVE" || token.isNative === true;
};

export default TOKEN_LIST;
