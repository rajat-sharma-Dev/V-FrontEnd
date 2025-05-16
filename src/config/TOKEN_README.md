# Token Configuration Guide

## Overview

This document provides guidance on how to customize token lists in the application. The token configuration system allows you to add, modify, or remove tokens from the supported list.

## File Location

The token configuration is located at: `src/config/tokens.js`

## Token Structure

Each token in the configuration has the following properties:

```javascript
{
  symbol: "TOKEN",        // Token symbol (e.g., "ETH", "USDT")
  name: "Token Name",     // Full token name (e.g., "Ethereum", "Tether USD")
  decimals: 18,           // Number of decimals the token uses
  logo: "/tokens/logo.png", // Path to token logo relative to public folder
  addresses: {            // Contract addresses on different networks
    1: "0x123...",        // Ethereum Mainnet (Chain ID: 1)
    11155111: "0x456...", // Sepolia Testnet (Chain ID: 11155111)
    137: "0x789...",      // Polygon Mainnet (Chain ID: 137)
    80001: "0xabc..."     // Mumbai Testnet (Chain ID: 80001)
  },
  isNative: false         // Whether this is a native token (like ETH, MATIC)
}
```

## Native Tokens

Native blockchain tokens (like ETH on Ethereum or MATIC on Polygon) should:
1. Use "NATIVE" as their address
2. Set `isNative: true`

Example:
```javascript
ETH: {
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
  logo: "/tokens/eth.png",
  addresses: {
    1: "NATIVE",      // Ethereum Mainnet
    11155111: "NATIVE", // Sepolia
  },
  isNative: true,
},
```

## Adding New Tokens

To add a new token:

1. Add the token's logo to `public/tokens/` directory
2. Add the token configuration to the `TOKEN_LIST` object in `src/config/tokens.js`

Example:
```javascript
SHIB: {
  symbol: "SHIB",
  name: "Shiba Inu",
  decimals: 18,
  logo: "/tokens/shib.png",
  addresses: {
    1: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", // Ethereum Mainnet
    137: "0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec", // Polygon
  },
},
```

## Utility Functions

The tokens.js file exports several useful functions:

- `getSupportedTokens(chainId)`: Returns an array of supported tokens for a specific chain
- `getTokenBySymbol(symbol)`: Get token information by its symbol
- `getTokenAddress(symbol, chainId)`: Get a token's address on a specific network
- `isNativeToken(symbol, chainId)`: Check if a token is native to the blockchain

## Token Logos

Token logos should be:
- Square images (recommended 128x128px)
- Placed in the `public/tokens/` directory
- Named with lowercase symbol (e.g., `eth.png`, `usdc.png`)

## Supported Networks

The application currently supports these networks:

| Network Name | Chain ID |
|--------------|----------|
| Ethereum Mainnet | 1 |
| Sepolia Testnet | 11155111 |
| Sepolia Base Testnet | 84531 |
| Polygon Mainnet | 137 |
| Mumbai Testnet | 80001 |

To add support for additional networks, ensure you add token addresses for those chain IDs.
