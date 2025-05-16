import { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import Navigation from '../components/Navigation';
import TokenDisplay from '../components/TokenDisplay';
import TokenSelector from '../components/TokenSelector';
import './Swap.css';
import { 
  createContractFromConfig, 
  createTokenContract,
  createSwapAggregatorContract
} from '../utils/contractHelpers';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { getSupportedTokens, getTokenBySymbol, getTokenAddress, isNativeToken } from '../config/tokens';
import SwapAggregatorABI from '../contracts/SwapAggregatorABI.json';

const Swap = () => {
  const { isConnected, chainId, account, signer } = useWeb3();
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [amount, setAmount] = useState('');
  const [availableTokens, setAvailableTokens] = useState([]);
  const [fromTokenBalance, setFromTokenBalance] = useState('0');
  const [toTokenBalance, setToTokenBalance] = useState('0');
  const [swapRate, setSwapRate] = useState(null);
  const [estimatedReceived, setEstimatedReceived] = useState('0');
  const [swapContract, setSwapContract] = useState(null);
  const [swapAggregator, setSwapAggregator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Additional state for swap aggregator functionality
  const [protocolRates, setProtocolRates] = useState({});
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [protocolParams, setProtocolParams] = useState({
    poolFee: 0,
    tickSpacing: 0,
    hook: '0x0000000000000000000000000000000000000000'
  });
  const [txStatus, setTxStatus] = useState({ status: '', message: '', hash: '' });

  // Initialize available tokens and swap contracts when chainId changes
  useEffect(() => {
    const loadTokenList = async () => {
      try {
        // Handle case where chainId is unavailable - use a default chainId of 1 (Ethereum Mainnet)
        // This ensures tokens are always shown even if wallet is not connected
        const networkId = chainId || 1;
        console.log("Loading tokens for network:", networkId);
        
        // Get supported tokens for the current network from our tokens.js file
        let tokens = getSupportedTokens(networkId);
        
        if (tokens.length === 0) {
          console.warn(`No tokens available for network ${networkId}`);
          // Try using a testnet if mainnet has no tokens
          const testnetId = 11155111; // Sepolia
          tokens = getSupportedTokens(testnetId);
          
          if (tokens.length === 0) {
            setError(`No tokens available. Please connect to a supported network.`);
            setAvailableTokens([]);
            return;
          }
        }

        // Format tokens for the dropdown
        const tokenArray = tokens.map(token => ({
          symbol: token.symbol,
          name: token.name,
          logo: token.logo,
          decimals: token.decimals,
          address: getTokenAddress(token.symbol, networkId),
          isNative: isNativeToken(token.symbol, networkId),
          // Include addresses property to maintain compatibility with TokenSelector filtering
          addresses: token.addresses
        }));
        
        console.log("Available tokens:", tokenArray);
        setAvailableTokens(tokenArray);
        
        // Set default selections if available
        if (tokenArray.length >= 2) {
          setFromToken(tokenArray[0].symbol);
          setToToken(tokenArray[1].symbol);
        }
        
        // Initialize contracts if signer is available
        if (signer) {
          // Initialize regular swap contract
          const contract = createContractFromConfig('SWAP', networkId, signer);
          setSwapContract(contract);
          
          // Initialize SwapAggregator contract
          try {
            const aggregatorContract = createSwapAggregatorContract(networkId, signer);
            
            if (aggregatorContract) {
              setSwapAggregator(aggregatorContract);
              console.log("SwapAggregator contract initialized");
            } else {
              console.warn("SwapAggregator address not found for this network");
            }
          } catch (err) {
            console.error("Failed to initialize SwapAggregator contract:", err);
          }
        }
      } catch (err) {
        console.error("Error loading token list:", err);
        setError("Failed to load available tokens");
      }
    };
    
    loadTokenList();
  }, [chainId, signer]);

  // Update token balances when selections change
  useEffect(() => {
    const updateTokenBalances = async () => {
      if (!isConnected || !account || !chainId) return;
      
      try {
        // Get "from" token balance
        if (fromToken) {
          const tokenInfo = getTokenBySymbol(fromToken);
          
          if (tokenInfo) {
            // Handle native tokens (ETH/MATIC)
            if (isNativeToken(fromToken, chainId)) {
              const provider = signer.provider;
              const balance = await provider.getBalance(account);
              setFromTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));
            } 
            // Handle ERC20 tokens
            else {
              const tokenContract = createTokenContract(fromToken, chainId, signer);
              if (tokenContract) {
                const balance = await tokenContract.balanceOf(account);
                setFromTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));
              }
            }
          }
        }
        
        // Get "to" token balance
        if (toToken) {
          const tokenInfo = getTokenBySymbol(toToken);
          
          if (tokenInfo) {
            // Handle native tokens (ETH/MATIC)
            if (isNativeToken(toToken, chainId)) {
              const provider = signer.provider;
              const balance = await provider.getBalance(account);
              setToTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));
            }
            // Handle ERC20 tokens
            else {
              const tokenContract = createTokenContract(toToken, chainId, signer);
              if (tokenContract) {
                const balance = await tokenContract.balanceOf(account);
                setToTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching token balances:", err);
      }
    };
    
    updateTokenBalances();
  }, [isConnected, account, chainId, fromToken, toToken, signer]);

  // Protocol enum from contract
  const SwapProtocol = {
    AERODROME_V1_STABLE: 0,
    AERODROME_V1_VOLATILE: 1,
    AERODROME_V2: 2,
    UNISWAP_X: 3,
    UNISWAP_V2: 4,
    UNISWAP_V3: 5,
    UNISWAP_V4: 6
  };
  
  // Map protocol numbers to readable names - wrapped in useMemo to avoid re-renders
  const protocolNames = useMemo(() => ({
    0: "Aerodrome V1 (Stable)",
    1: "Aerodrome V1 (Volatile)",
    2: "Aerodrome V2",
    3: "Uniswap X",
    4: "Uniswap V2",
    5: "Uniswap V3",
    6: "Uniswap V4"
  }), []);

  // Calculate swap rate when tokens or amount changes
  useEffect(() => {
    const calculateSwapRate = async () => {
      if (!isConnected || !fromToken || !toToken || !chainId) {
        setSwapRate(null);
        setEstimatedReceived('0');
        setSelectedProtocol(null);
        return;
      }
      
      // Skip calculation if tokens are the same
      if (fromToken === toToken) {
        setSwapRate(1);
        setEstimatedReceived(amount || '0');
        setSelectedProtocol(null);
        return;
      }
      
      try {
        // If no amount provided, don't query the contract
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
          setSwapRate(null);
          setEstimatedReceived('0');
          setSelectedProtocol(null);
          return;
        }
        
        // If we have the SwapAggregator contract, get quotes from all protocols
        if (swapAggregator) {
          // Get token addresses
          const fromAddress = getTokenAddress(fromToken, chainId);
          const toAddress = getTokenAddress(toToken, chainId);
          
          if (!fromAddress || !toAddress) {
            console.error("Token addresses not found for the current network");
            return;
          }
          
          // Convert amount to token units
          const fromTokenInfo = getTokenBySymbol(fromToken);
          const amountInWei = ethers.parseUnits(amount, fromTokenInfo.decimals);
          
          // Store all protocol quotes
          const quotes = {};
          let bestRate = 0;
          let bestProtocol = null;
          let bestParams = {};
          
          // Get Aerodrome quote
          try {
            const [aerodromeAmountOut, aerodromeProtocol, tickSpacing] = await swapAggregator.getAmountOutAerodrome(
              fromAddress,
              toAddress,
              amountInWei,
              account
            );
            
            const toTokenInfo = getTokenBySymbol(toToken);
            const formattedAmount = ethers.formatUnits(aerodromeAmountOut, toTokenInfo.decimals);
            
            quotes[aerodromeProtocol] = {
              amountOut: formattedAmount,
              rate: parseFloat(formattedAmount) / parseFloat(amount),
              params: { tickSpacing }
            };
            
            // Update best rate if this is better
            if (parseFloat(formattedAmount) > bestRate) {
              bestRate = parseFloat(formattedAmount);
              bestProtocol = aerodromeProtocol;
              bestParams = { tickSpacing };
            }
            
            console.log(`Aerodrome quote (protocol ${aerodromeProtocol}):`, formattedAmount);
          } catch (err) {
            console.error("Error getting Aerodrome quote:", err);
          }
          
          // Get Uniswap V2 quote
          try {
            const [uniV2AmountOut, uniV2Protocol] = await swapAggregator.getAmountOutUniswapV2(
              fromAddress,
              toAddress,
              amountInWei
            );
            
            const toTokenInfo = getTokenBySymbol(toToken);
            const formattedAmount = ethers.formatUnits(uniV2AmountOut, toTokenInfo.decimals);
            
            quotes[uniV2Protocol] = {
              amountOut: formattedAmount,
              rate: parseFloat(formattedAmount) / parseFloat(amount),
              params: {}
            };
            
            // Update best rate if this is better
            if (parseFloat(formattedAmount) > bestRate) {
              bestRate = parseFloat(formattedAmount);
              bestProtocol = uniV2Protocol;
              bestParams = {};
            }
            
            console.log(`Uniswap V2 quote:`, formattedAmount);
          } catch (err) {
            console.error("Error getting Uniswap V2 quote:", err);
          }
          
          // Get Uniswap V3 quote with standard fee tiers
          try {
            const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
            const poolFees = feeTiers.map(fee => fee);
            
            const [uniV3AmountOut, uniV3PoolFee, uniV3Protocol] = await swapAggregator.getAmountOutUniswapV3(
              fromAddress,
              toAddress,
              amountInWei,
              poolFees
            );
            
            const toTokenInfo = getTokenBySymbol(toToken);
            const formattedAmount = ethers.formatUnits(uniV3AmountOut, toTokenInfo.decimals);
            
            quotes[uniV3Protocol] = {
              amountOut: formattedAmount,
              rate: parseFloat(formattedAmount) / parseFloat(amount),
              params: { poolFee: uniV3PoolFee }
            };
            
            // Update best rate if this is better
            if (parseFloat(formattedAmount) > bestRate) {
              bestRate = parseFloat(formattedAmount);
              bestProtocol = uniV3Protocol;
              bestParams = { poolFee: uniV3PoolFee };
            }
            
            console.log(`Uniswap V3 quote:`, formattedAmount);
          } catch (err) {
            console.error("Error getting Uniswap V3 quote:", err);
          }
          
          // For V4, we would need pool configurations which might not be available on all networks
          // This is a placeholder for V4 integration
          /*
          try {
            const poolFees = [500, 3000, 10000]; // Standard fee tiers
            const tickSpacings = [10, 60, 200]; // Standard tick spacings
            const hooks = ['0x0000000000000000000000000000000000000000']; // No hooks for example
            
            const [uniV4AmountOut, uniV4PoolFee, uniV4TickSpacing, uniV4Hook, uniV4Protocol] = 
              await swapAggregator.getAmountOutUniswapV4(
                fromAddress,
                toAddress,
                amountInWei,
                poolFees,
                tickSpacings,
                hooks
              );
            
            const toTokenInfo = getTokenBySymbol(toToken);
            const formattedAmount = ethers.formatUnits(uniV4AmountOut, toTokenInfo.decimals);
            
            quotes[uniV4Protocol] = {
              amountOut: formattedAmount,
              rate: parseFloat(formattedAmount) / parseFloat(amount),
              params: { poolFee: uniV4PoolFee, tickSpacing: uniV4TickSpacing, hook: uniV4Hook }
            };
            
            // Update best rate if this is better
            if (parseFloat(formattedAmount) > bestRate) {
              bestRate = parseFloat(formattedAmount);
              bestProtocol = uniV4Protocol;
              bestParams = { poolFee: uniV4PoolFee, tickSpacing: uniV4TickSpacing, hook: uniV4Hook };
            }
          } catch (err) {
            console.error("Error getting Uniswap V4 quote:", err);
          }
          */
          
          // Update state with all quotes and the best option
          setProtocolRates(quotes);
          
          if (bestProtocol !== null) {
            setSelectedProtocol(bestProtocol);
            setProtocolParams(bestParams);
            setEstimatedReceived(quotes[bestProtocol].amountOut);
            setSwapRate(quotes[bestProtocol].rate);
            
            console.log(`Selected protocol: ${protocolNames[bestProtocol]} with rate: ${quotes[bestProtocol].rate}`);
          } else {
            // If no quotes are available, use fallback
            console.warn("No valid quotes received from any protocol, using fallback rate");
            applyFallbackRate();
          }
        } else {
          console.warn("SwapAggregator not available, using fallback rate");
          applyFallbackRate();
        }
      } catch (err) {
        console.error("Error calculating swap rates:", err);
        applyFallbackRate();
      }
    };
    
    // Fallback to simple mock rate when contract calls fail
    const applyFallbackRate = () => {
      // Simple mock rate calculation
      const mockRate = fromToken === 'WETH' ? 1800 : 
                       fromToken === 'WMATIC' ? 0.8 : 
                       fromToken === 'USDC' ? 1 : 2;
      
      setSwapRate(mockRate);
      setSelectedProtocol(null);
      
      if (amount && !isNaN(amount)) {
        const received = parseFloat(amount) * mockRate;
        setEstimatedReceived(received.toFixed(6));
      } else {
        setEstimatedReceived('0');
      }
    };
    
    calculateSwapRate();
  }, [isConnected, fromToken, toToken, amount, swapAggregator, swapContract, chainId, account, protocolNames]);

  const handleSwap = async (e) => {
    e.preventDefault();
    
    if (!isConnected || !fromToken || !toToken || !amount) {
      setError("Please connect wallet and fill all fields");
      return;
    }
    
    if (fromToken === toToken) {
      setError("Cannot swap the same token");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Get token information
      const fromTokenInfo = getTokenBySymbol(fromToken);
      const toTokenInfo = getTokenBySymbol(toToken);
      
      if (!fromTokenInfo || !toTokenInfo) {
        setError("Invalid token selection");
        setLoading(false);
        return;
      }
      
      // Get token addresses
      const fromAddress = getTokenAddress(fromToken, chainId);
      const toAddress = getTokenAddress(toToken, chainId);
      
      if (!fromAddress || !toAddress) {
        setError("Token not supported on this network");
        setLoading(false);
        return;
      }
      
      // Convert amount to token units
      const amountInWei = ethers.parseUnits(amount, fromTokenInfo.decimals);
      
      // Check if we have the SwapAggregator contract and a selected protocol
      if (swapAggregator && selectedProtocol !== null) {
        console.log(`Using ${protocolNames[selectedProtocol]} for swap`);
        
        // Always approve first if using ERC20 tokens
        if (!isNativeToken(fromToken, chainId)) {
          const tokenContract = createTokenContract(fromToken, chainId, signer);
          
          if (!tokenContract) {
            setError("Failed to create token contract");
            setLoading(false);
            return;
          }
          
          // For SwapAggregator, we need to approve it to spend our tokens
          const swapAggregatorAddress = swapAggregator.target;
          const allowance = await tokenContract.allowance(account, swapAggregatorAddress);
          
          if (allowance < amountInWei) {
            console.log("Approving token transfer to SwapAggregator...");
            const approveTx = await tokenContract.approve(swapAggregatorAddress, amountInWei);
            await approveTx.wait();
            console.log("Approval complete");
          }
        }
        
        // Execute swap based on the selected protocol
        let txHash;
        
        // Update transaction status
        setTxStatus({ 
          status: 'pending',
          message: 'Preparing transaction...',
          hash: ''
        });
          
        try {
          switch (selectedProtocol) {
            case SwapProtocol.AERODROME_V1_STABLE: {
              console.log("Swapping using Aerodrome V1 Stable...");
              setTxStatus({ 
                status: 'pending',
                message: 'Executing swap via Aerodrome V1 (Stable)...',
                hash: ''
              });
              
              const stableTx = await swapAggregator.swapUsingAerodromeV1Stable(
                fromAddress,
                toAddress,
                amountInWei,
                account
              );
              
              setTxStatus({ 
                status: 'confirming',
                message: 'Waiting for transaction confirmation...',
                hash: stableTx.hash
              });
              
              await stableTx.wait();
              txHash = stableTx.hash;
              break;
            }            case SwapProtocol.AERODROME_V1_VOLATILE: {
              console.log("Swapping using Aerodrome V1 Volatile...");
              setTxStatus({ 
                status: 'pending',
                message: 'Executing swap via Aerodrome V1 (Volatile)...',
                hash: ''
              });
              
              const volatileTx = await swapAggregator.swapUsingAerodromeV1Volatile(
                fromAddress,
                toAddress,
                amountInWei,
                account
              );
              
              setTxStatus({ 
                status: 'confirming',
                message: 'Waiting for transaction confirmation...',
                hash: volatileTx.hash
              });
              
              await volatileTx.wait();
              txHash = volatileTx.hash;
              break;
            }
            
          case SwapProtocol.AERODROME_V2: {
            console.log("Swapping using Aerodrome V2...");
            const v2Tx = await swapAggregator.swapUsingAerodromeV2(
              fromAddress,
              toAddress,
              amountInWei,
              account,
              protocolParams.tickSpacing
            );
            await v2Tx.wait();
            txHash = v2Tx.hash;
            break;
          }
            
          case SwapProtocol.UNISWAP_V2:
          case SwapProtocol.UNISWAP_V3:
          case SwapProtocol.UNISWAP_V4: {
            let version = 2;
            if (selectedProtocol === SwapProtocol.UNISWAP_V3) version = 3;
            if (selectedProtocol === SwapProtocol.UNISWAP_V4) version = 4;
            
            console.log(`Swapping using Uniswap V${version}...`);
            const uniTx = await swapAggregator.swapUsingUniswapUniversalRouter(
              fromAddress,
              toAddress,
              amountInWei,
              account,
              protocolParams.poolFee || 3000, // Default to 0.3% if not available
              protocolParams.tickSpacing || 0,
              protocolParams.hook || '0x0000000000000000000000000000000000000000',
              version
            );
            await uniTx.wait();
            txHash = uniTx.hash;
            break;
          }
            
          default: {
            // Fall back to regular swap contract if available
            if (swapContract) {
              console.log("Using fallback swap contract...");
              // Handle based on whether the source token is native (ETH/MATIC) or ERC20
              if (isNativeToken(fromToken, chainId)) {
                // Swapping native token (ETH/MATIC) -> ERC20
                console.log(`Swapping native ${fromToken} for ${toToken}...`);
                
                // In a real implementation, you would call your swap contract with value
                // const swapTx = await swapContract.swapExactETHForTokens(
                //   toAddress,
                //   { value: amountInWei }
                // );
                // await swapTx.wait();
              } else {
                // Check allowance and approve if needed
                const tokenContract = createTokenContract(fromToken, chainId, signer);
                const allowance = await tokenContract.allowance(account, swapContract.target);
                
                if (allowance < amountInWei) {
                  console.log("Approving token transfer to regular swap contract...");
                  const approveTx = await tokenContract.approve(swapContract.target, amountInWei);
                  await approveTx.wait();
                }
                
                // Execute swap in regular contract (this is a mock)
                console.log(`Swapping ${amount} ${fromToken} for ${toToken} using regular contract...`);
              }
            } else {
              setError("No swap mechanism available");
              setLoading(false);
              return;
            }
            break;
          }
        }
        
        console.log(`Swap completed: ${amount} ${fromToken} for ${estimatedReceived} ${toToken}`);
        if (txHash) {
          console.log(`Transaction hash: ${txHash}`);
        }
      } else if (swapContract) {
        // Fall back to regular swap contract
        console.log("Using regular swap contract (SwapAggregator not available)");
        
        // Handle based on whether the source token is native (ETH/MATIC) or ERC20
        if (isNativeToken(fromToken, chainId)) {
          // Swapping native token (ETH/MATIC) -> ERC20
          console.log(`Swapping native ${fromToken} for ${toToken}...`);
          
          // In a real implementation, you would call your swap contract with value
          // const swapTx = await swapContract.swapExactETHForTokens(
          //   toAddress,
          //   { value: amountInWei }
          // );
          // await swapTx.wait();
        } else {
          // Swapping ERC20 -> ERC20 or ERC20 -> Native
          // Create token contract for approval
          const tokenContract = createTokenContract(fromToken, chainId, signer);
          
          if (!tokenContract) {
            setError("Failed to create token contract");
            setLoading(false);
            return;
          }
          
          // Check allowance and approve if needed
          const allowance = await tokenContract.allowance(account, swapContract.target);
          
          if (allowance < amountInWei) {
            console.log("Approving token transfer...");
            const approveTx = await tokenContract.approve(swapContract.target, amountInWei);
            await approveTx.wait();
          }
          
          // Execute swap (this is a mock - you would call your actual swap function)
          console.log(`Swapping ${amount} ${fromToken} for ${toToken}...`);
          
          // In a real implementation, you would call your swap contract
          // if (isNativeToken(toToken, chainId)) {
          //   // ERC20 -> Native (ETH/MATIC)
          //   const swapTx = await swapContract.swapExactTokensForETH(
          //     fromAddress,
          //     amountInWei,
          //   );
          // } else {
          //   // ERC20 -> ERC20
          //   const swapTx = await swapContract.swapExactTokensForTokens(
          //     fromAddress,
          //     toAddress,
          //     amountInWei,
          //   );
          // }
          // await swapTx.wait();
        }
      } else {
        setError("No swap contract available");
        setLoading(false);
        return;
      }
      
      // Reset form or show success message
      setLoading(false);
    } catch (err) {
      console.error("Swap error:", err);
      setError(`Transaction failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1>Token Swap</h1>
        <WalletConnect />
      </header>
      <Navigation />
      
      <main className="main-content">
        <div className="intro-section">
          <h2>Swap Interface</h2>
          <p>
            Swap between different tokens using decentralized exchanges.
          </p>
        </div>
        
        <div className="swap-container">
          {/* Debug information */}
          <div style={{display: 'none'}}>
            <p>Chain ID: {chainId}</p>
            <p>Available tokens: {availableTokens.length}</p>
            <p>Current Network: {chainId ? `Chain ID ${chainId}` : 'Not connected'}</p>
          </div>

          {isConnected ? (
            <form onSubmit={handleSwap} className="swap-form">
              <div className="token-swap-card">
                {/* From Token Section */}
                <div className="swap-section from-section">
                  <div className="swap-header">
                    <label htmlFor="fromToken">From</label>
                    <span className="token-balance">
                      Balance: {parseFloat(fromTokenBalance).toFixed(6)}
                    </span>
                  </div>
                  
                  <div className="token-input-row">
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      step="any"
                      min="0"
                      required
                      className="token-amount-input"
                    />
                    
                    {/* Add console log for debugging */}
                    {console.log("Rendering TokenSelector with tokens:", availableTokens)}
                    <TokenSelector
                      id="fromToken"
                      label="From"
                      tokens={availableTokens}
                      value={fromToken}
                      onChange={setFromToken}
                    />
                  </div>
                  
                  <div className="max-button-row">
                    <button
                      type="button"
                      className="max-button"
                      onClick={() => setAmount(fromTokenBalance)}
                    >
                      MAX
                    </button>
                  </div>
                </div>
                
                {/* Swap Direction Button */}
                <div className="swap-direction">
                  <button 
                    type="button" 
                    className="swap-direction-btn"
                    onClick={() => {
                      const temp = fromToken;
                      setFromToken(toToken);
                      setToToken(temp);
                    }}
                  >
                    ↓↑
                  </button>
                </div>
                
                {/* To Token Section */}
                <div className="swap-section to-section">
                  <div className="swap-header">
                    <label htmlFor="toToken">To</label>
                    <span className="token-balance">
                      Balance: {parseFloat(toTokenBalance).toFixed(6)}
                    </span>
                  </div>
                  
                  <div className="token-input-row">
                    <div className="estimated-amount">
                      {estimatedReceived}
                    </div>
                    
                    <TokenSelector
                      id="toToken"
                      label="To"
                      tokens={availableTokens}
                      value={toToken}
                      onChange={setToToken}
                    />
                  </div>
                  
                  <div className="exchange-rate">
                    {swapRate && fromToken && toToken ? (
                      <div className="rate-details">
                        <span className="rate-main">
                          1 {fromToken} ≈ {swapRate} {toToken}
                        </span>
                        <span className="rate-type">
                          {isNativeToken(fromToken, chainId) ? '(Native)' : '(ERC20)'} → 
                          {isNativeToken(toToken, chainId) ? '(Native)' : '(ERC20)'}
                        </span>
                        
                        {/* Protocol Selection */}
                        {selectedProtocol !== null && (
                          <div className="protocol-selection">
                            <span className="protocol-info">
                              Best Protocol: {protocolNames[selectedProtocol]}
                            </span>
                            
                            {Object.keys(protocolRates).length > 1 && (
                              <div className="protocol-options">
                                <details>
                                  <summary>View all available protocols</summary>
                                  <div className="protocol-list">
                                    {Object.entries(protocolRates).map(([protoId, details]) => (
                                      <div 
                                        key={protoId} 
                                        className={`protocol-option ${selectedProtocol === Number(protoId) ? 'selected' : ''}`}
                                        onClick={() => {
                                          setSelectedProtocol(Number(protoId));
                                          setProtocolParams(details.params);
                                          setEstimatedReceived(details.amountOut);
                                          setSwapRate(details.rate);
                                        }}
                                      >
                                        <span className="protocol-name">{protocolNames[protoId]}</span>
                                        <span className="protocol-rate">
                                          Rate: {details.rate.toFixed(6)}
                                        </span>
                                        <span className="protocol-amount">
                                          Get: {parseFloat(details.amountOut).toFixed(6)}
                                        </span>
                                        {selectedProtocol === Number(protoId) && (
                                          <span className="protocol-badge">Selected</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <span className="network-info">
                          Network: Chain ID {chainId}
                        </span>
                      </div>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </div>
                </div>
                
                {/* Error message display */}
                {error && (
                  <div className="swap-error">
                    {error}
                  </div>
                )}

                {/* Swap button */}
                <button 
                  type="submit" 
                  className="swap-button"
                  disabled={loading || !fromToken || !toToken || !amount || fromToken === toToken}
                >
                  {loading ? 'Swapping...' : 'Swap Tokens'}
                </button>
              </div>
            </form>
          ) : (
            <div className="connect-prompt">
              <p>Please connect your wallet to use the swap feature.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Swap;
