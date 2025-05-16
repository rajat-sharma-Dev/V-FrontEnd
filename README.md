# Ethereum Smart Contract Frontend

A React-based frontend application for interacting with Ethereum smart contracts.

## Features

- Web3 integration with ethers.js
- Connect to MetaMask and other Ethereum wallets
- ERC20 token interaction functionality
- Marketplace for buying and selling items
- Token swapping interface
- Validator staking dashboard
- Smart contract configuration management
- Modern React with hooks & context
- Responsive design
- Comprehensive token list configuration
- Support for both native tokens and ERC20 tokens

## Technology Stack

- **React**: Frontend UI library
- **Vite**: Build tool and development server
- **ethers.js**: Ethereum web client library
- **React Router**: Navigation for multiple pages
- **React Context API**: State management
- **CSS**: Styling

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- A web browser with MetaMask or other Ethereum wallet extension

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd newfrontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `src/components`: Reusable UI components
- `src/config`: Smart contract configuration files
- `src/contexts`: React context providers
- `src/hooks`: Custom React hooks
- `src/utils`: Utility functions
- `src/contracts`: Smart contract ABIs
- `src/pages`: Application pages/routes

## Smart Contract Configuration

The application uses a centralized contract configuration system located at `src/config/contracts.js`. This file contains:

- Network configurations for multiple chains
- Smart contract addresses for different networks
- Smart contract ABIs
- Helper functions for managing contract interactions

To use your own contracts:

1. Update the contract addresses in `CONTRACT_ADDRESSES` with your deployed contract addresses
2. Add or update contract ABIs in `CONTRACT_ABIS`
3. Use the helper functions like `createContractFromConfig` to create contract instances

For detailed instructions, see [Smart Contract Integration Guide](src/config/README.md).

## Token System

This application includes a comprehensive token management system that supports:

- Native tokens (ETH, MATIC)
- ERC20 tokens on multiple networks
- Token logos and metadata
- Automatic balance checking
- Network-specific token configurations

The token system can be customized by editing the configuration in `src/config/tokens.js`. 
See `src/config/TOKEN_README.md` for detailed documentation on customizing the token list.

### Adding Custom Tokens

To add your own tokens:
1. Add the token logo to `public/tokens/`
2. Add the token configuration to `src/config/tokens.js`
3. Ensure you include the correct contract addresses for each supported network

Example:
```javascript
MYTOKEN: {
  symbol: "MYTOKEN",
  name: "My Custom Token",
  decimals: 18,
  logo: "/tokens/mytoken.png",
  addresses: {
    1: "0x...", // Mainnet address
    11155111: "0x...", // Sepolia address
  },
},
```

## Usage

1. Connect your wallet using the "Connect Wallet" button in the header
2. Navigate to different sections using the navigation menu:
   - **Home**: Overview and main navigation
   - **Buyer**: Browse and purchase items from the marketplace
   - **Seller**: Create and manage your marketplace listings
   - **Swap**: Exchange tokens using swap functionality
   - **Validator**: Stake tokens and run a validator node
3. Use the token interaction component to work with ERC20 tokens

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
