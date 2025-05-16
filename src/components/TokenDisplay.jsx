import { useWeb3 } from '../hooks/useWeb3';
import { getTokenBySymbol, isNativeToken } from '../config/tokens';

/**
 * Component to display token information in a standardized format
 * 
 * @param {Object} props
 * @param {string} props.symbol - The token symbol
 * @param {boolean} props.showLogo - Whether to show the token logo
 * @param {boolean} props.showName - Whether to show the token name
 * @param {boolean} props.showBadge - Whether to show the native token badge
 * @param {string} props.size - Size of the display ('small', 'medium', 'large')
 */
const TokenDisplay = ({ 
  symbol, 
  showLogo = true, 
  showName = false, 
  showBadge = true,
  size = 'medium' 
}) => {
  const { chainId } = useWeb3();
  const token = getTokenBySymbol(symbol);
  
  if (!token) {
    return <span className="token-display">{symbol || '???'}</span>;
  }
  
  // Calculate logo size
  const logoSizes = {
    small: 16,
    medium: 24,
    large: 32
  };
  const logoSize = logoSizes[size] || 24;
  
  // Check if token is native
  const native = isNativeToken(symbol, chainId);
  
  return (
    <div className={`token-display token-display-${size}`}>
      {showLogo && token.logo && (
        <img 
          src={token.logo} 
          alt={token.symbol}
          width={logoSize}
          height={logoSize}
          className="token-logo"
        />
      )}
      
      <span className="token-symbol">
        {token.symbol}
      </span>
      
      {showName && (
        <span className="token-name">
          {token.name}
        </span>
      )}
      
      {showBadge && native && (
        <span className="native-token-badge">
          native
        </span>
      )}
    </div>
  );
};

export default TokenDisplay;
