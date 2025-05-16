import { useState, useRef, useEffect } from 'react';
import TokenDisplay from './TokenDisplay';
import { getTokenBySymbol } from '../config/tokens';
import './TokenSelector.css';

/**
 * Enhanced token selector component with search and token display
 * 
 * @param {Object} props
 * @param {Array} props.tokens - Array of available tokens
 * @param {string} props.value - Currently selected token symbol
 * @param {Function} props.onChange - Callback when token selection changes
 * @param {string} props.id - HTML id attribute
 * @param {string} props.label - Label for the selector
 */
const TokenSelector = ({ tokens, value, onChange, id, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  
  // Filter tokens based on search query only
  const filteredTokens = tokens?.filter(token => {
    // Don't filter by chainId here - we've already done that in Swap.jsx
    // Just filter by search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query)
    );
  }) || [];
  
  console.log("TokenSelector received tokens:", tokens);
  console.log("Filtered tokens:", filteredTokens);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Select a token and close the dropdown
  const handleSelectToken = (symbol) => {
    onChange(symbol);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  // Get token details for the currently selected token
  const selectedToken = value ? getTokenBySymbol(value) : null;
  
  return (
    <div className="token-selector-container" ref={dropdownRef}>
      <label htmlFor={id} className="selector-label">{label}</label>
      
      <div 
        className="token-selector" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedToken ? (
          <div className="selected-token">
            <TokenDisplay 
              symbol={selectedToken.symbol}
              showName={true}
              showBadge={true}
            />
          </div>
        ) : (
          <div className="no-token-selected">
            Select Token
          </div>
        )}
        
        <span className="dropdown-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="token-dropdown">
          <div className="token-search">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token..."
              onClick={(e) => e.stopPropagation()}
              className="token-search-input"
              autoFocus
            />
          </div>
          
          <div className="token-list">
            {filteredTokens.length > 0 ? (
              filteredTokens.map(token => (
                <div
                  key={`token-${token.symbol}`}
                  className={`token-item ${value === token.symbol ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectToken(token.symbol);
                  }}
                >
                  <TokenDisplay 
                    symbol={token.symbol}
                    showName={true}
                    showBadge={true}
                  />
                </div>
              ))
            ) : (
              <div className="no-tokens-found">
                No tokens found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;
