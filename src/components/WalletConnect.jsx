import { useWeb3 } from '../hooks/useWeb3';

/**
 * Wallet Connect Button Component
 */
const WalletConnect = () => {
  const { isConnected, connect, disconnect, account, balance, networkName } = useWeb3();

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <div className="account-info">
            <p>
              <strong>Account:</strong> {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}
            </p>
            <p>
              <strong>Network:</strong> {networkName}
            </p>
            <p>
              <strong>Balance:</strong> {balance ? `${Number(balance).toFixed(4)} ETH` : '0 ETH'}
            </p>
          </div>
          <button className="disconnect-button" onClick={disconnect}>
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button className="connect-button" onClick={connect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
