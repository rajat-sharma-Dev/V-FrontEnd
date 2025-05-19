import { ethers } from "ethers";

/**
 * Connect to Ethereum provider
 * @param {string} walletType - The type of wallet to connect to ('coinbase' or 'metamask')
 * @returns {Promise<{provider: ethers.BrowserProvider, signer: ethers.Signer}>}
 */
export const connectWallet = async (walletType = "coinbase") => {
    try {
        // Detect available providers
        const isCoinbaseAvailable =
            window.ethereum?.isCoinbaseWallet ||
            (window.ethereum?.providers &&
                window.ethereum.providers.find((p) => p.isCoinbaseWallet));

        const isMetaMaskAvailable =
            window.ethereum?.isMetaMask ||
            (window.ethereum?.providers &&
                window.ethereum.providers.find((p) => p.isMetaMask));

        let ethereum;

        // Select the appropriate provider based on walletType
        if (window.ethereum?.providers) {
            // Handle multiple injected providers (common in mobile browsers)
            if (walletType === "coinbase" && isCoinbaseAvailable) {
                ethereum = window.ethereum.providers.find(
                    (p) => p.isCoinbaseWallet
                );
            } else if (walletType === "metamask" && isMetaMaskAvailable) {
                ethereum = window.ethereum.providers.find((p) => p.isMetaMask);
            } else {
                // Fallback to first available provider
                ethereum = window.ethereum.providers[0];
            }
        } else {
            // Single injected provider
            ethereum = window.ethereum;

            // Validate provider type against requested wallet
            if (
                (walletType === "coinbase" && !isCoinbaseAvailable) ||
                (walletType === "metamask" && !isMetaMaskAvailable)
            ) {
                console.warn(
                    `Requested ${walletType} wallet, but it's not the detected provider`
                );
            }
        }

        if (!ethereum) {
            const message =
                walletType === "coinbase"
                    ? "Coinbase Wallet not installed. Please install Coinbase Wallet to continue."
                    : "MetaMask not installed. Please install MetaMask to continue.";
            console.error(message);
            throw new Error(message);
        }

        // Request account access
        const accounts = await ethereum.request({
            method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found after connecting");
        }

        // Create ethers provider - first try BrowserProvider (ethers v6)
        let provider;
        let signer;

        try {
            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
        } catch (providerError) {
            console.error(
                "Error creating BrowserProvider, trying alternative:",
                providerError
            );

            // Fall back to alternative approach for compatibility
            try {
                // Try creating a provider from provider.request
                const customProvider = {
                    request: ethereum.request.bind(ethereum),
                    on: ethereum.on.bind(ethereum),
                    removeListener: ethereum.removeListener.bind(ethereum),
                };

                provider = new ethers.BrowserProvider(customProvider);
                signer = await provider.getSigner(accounts[0]);
            } catch (fallbackError) {
                console.error("Error with fallback provider:", fallbackError);
                throw new Error("Failed to connect to wallet provider");
            }
        }

        return { provider, signer };
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        throw error;
    }
};

/**
 * Get the current network
 * @param {ethers.BrowserProvider} provider - The ethers provider
 * @returns {Promise<{chainId: number, name: string}>}
 */
export const getNetwork = async (provider) => {
    try {
        const network = await provider.getNetwork();

        // Handle different provider types (v6 vs legacy)
        let chainId;
        let name;

        if (network.chainId && typeof network.chainId === "bigint") {
            // ethers v6 returns chainId as bigint
            chainId = Number(network.chainId);
        } else if (network.chainId) {
            // Handle numeric chainId
            chainId = Number(network.chainId);
        } else {
            // Fallback
            chainId = (await provider.getNetwork()).chainId;
        }

        // Get network name
        name = network.name || getNetworkNameFromChainId(chainId);

        return { chainId, name };
    } catch (error) {
        console.error("Error getting network:", error);

        // Fallback to getting chainId directly from ethereum provider
        try {
            const chainIdHex = await window.ethereum.request({
                method: "eth_chainId",
            });
            const chainId = parseInt(chainIdHex, 16);
            return {
                chainId,
                name: getNetworkNameFromChainId(chainId),
            };
        } catch (fallbackError) {
            console.error("Fallback network detection failed:", fallbackError);
            throw error;
        }
    }
};

/**
 * Get network name from chain ID
 * @param {number} chainId - The chain ID
 * @returns {string} Network name
 */
function getNetworkNameFromChainId(chainId) {
    const networks = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
        11155111: "Sepolia Testnet",
        137: "Polygon Mainnet",
        80001: "Polygon Mumbai",
        42161: "Arbitrum One",
        43114: "Avalanche C-Chain",
        56: "Binance Smart Chain",
        84532: "Base Sepolia",
        8453: "Base",
        // Add more networks as needed
    };

    return networks[chainId] || `Chain ID ${chainId}`;
}

/**
 * Switch network if needed
 * @param {number} chainId - The target chain ID
 */
export const switchNetwork = async (chainId) => {
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
    } catch (error) {
        console.error("Error switching network:", error);
        throw error;
    }
};

/**
 * Save wallet preference to localStorage
 * @param {string} walletType - The wallet type ('coinbase' or 'metamask')
 */
export const saveWalletPreference = (walletType) => {
    try {
        localStorage.setItem("preferredWallet", walletType);
        console.log(`Saved wallet preference: ${walletType}`);
    } catch (error) {
        console.error("Error saving wallet preference:", error);
    }
};

/**
 * Get preferred wallet from localStorage
 * @returns {string} - The preferred wallet type ('coinbase' or 'metamask')
 */
export const getPreferredWallet = () => {
    try {
        return localStorage.getItem("preferredWallet") || "coinbase";
    } catch (error) {
        console.error("Error getting wallet preference:", error);
        return "coinbase";
    }
};
