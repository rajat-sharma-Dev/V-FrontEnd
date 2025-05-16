import { ethers } from 'ethers';

/**
 * Connect to Ethereum provider
 * @returns {Promise<{provider: ethers.BrowserProvider, signer: ethers.Signer}>}
 */
export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install it to use this app.');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create ethers provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return { provider, signer };
  } catch (error) {
    console.error('Error connecting to wallet:', error);
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
    return {
      chainId: Number(network.chainId),
      name: network.name
    };
  } catch (error) {
    console.error('Error getting network:', error);
    throw error;
  }
};

/**
 * Switch network if needed
 * @param {number} chainId - The target chain ID
 */
export const switchNetwork = async (chainId) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    console.error('Error switching network:', error);
    throw error;
  }
};
