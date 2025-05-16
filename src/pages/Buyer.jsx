import { useState, useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';
import Navigation from '../components/Navigation';
import CreateContract from '../components/CreateContract';
import MyContracts from '../components/MyContracts';
import ViewContracts from '../components/ViewContracts';
import { useWeb3 } from '../hooks/useWeb3';
import { createContractFromConfig } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import './Buyer.css';

const Buyer = () => {
  const { isConnected, chainId, signer, account } = useWeb3();
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('options'); // options, createContract, myContracts, viewContracts, marketplace
  const [userContracts, setUserContracts] = useState([]);
  
  // Load user contracts from localStorage when account changes
  useEffect(() => {
    if (account) {
      const savedContracts = localStorage.getItem(`buyer-contracts-${account}`);
      if (savedContracts) {
        setUserContracts(JSON.parse(savedContracts));
      } else {
        setUserContracts([]);
      }
    } else {
      setUserContracts([]);
    }
  }, [account]);

  // Initialize marketplace contract when connected
  useEffect(() => {
    if (isConnected && chainId && signer) {
      const contract = createContractFromConfig('MARKETPLACE', chainId, signer);
      setMarketplaceContract(contract);
    } else {
      setMarketplaceContract(null);
      setItems([]);
    }
  }, [isConnected, chainId, signer]);

  // Save contracts to localStorage when they change
  useEffect(() => {
    if (account && userContracts.length > 0) {
      localStorage.setItem(`buyer-contracts-${account}`, JSON.stringify(userContracts));
    }
  }, [userContracts, account]);

  // Load marketplace items when contract is initialized
  useEffect(() => {
    const loadMarketplaceItems = async () => {
      if (!marketplaceContract) return;

      try {
        setLoading(true);
        setError(null);

        // Get item count from contract
        const itemCount = await marketplaceContract.getItemCount();
        const totalItems = parseInt(itemCount.toString());
        
        // Load each item
        const itemsData = [];
        for (let i = 1; i <= totalItems; i++) {
          try {
            const item = await marketplaceContract.getItemDetails(i);
            if (!item.sold) {
              itemsData.push({
                id: i,
                name: item.name,
                description: item.description,
                price: ethers.formatEther(item.price),
                seller: item.seller,
                sold: item.sold
              });
            }
          } catch (err) {
            console.error(`Error loading item ${i}:`, err);
          }
        }

        setItems(itemsData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading marketplace items:", err);
        setError("Failed to load items from marketplace");
        setLoading(false);
      }
    };

    loadMarketplaceItems();
  }, [marketplaceContract]);

  const handleBuyItem = async (itemId, price) => {
    if (!marketplaceContract || !isConnected) return;

    try {
      setLoading(true);
      const tx = await marketplaceContract.buyItem(itemId, {
        value: ethers.parseEther(price)
      });
      
      await tx.wait();
      
      // Refresh items after purchase
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      setLoading(false);
    } catch (err) {
      console.error("Error buying item:", err);
      setError("Transaction failed: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1>Buyer Dashboard</h1>
        <WalletConnect />
      </header>
      <Navigation />
      
      <main className="main-content">
        <div className="intro-section">
          <h2>Buyer Interface</h2>
          <p>
            Create and manage service contracts with sellers as a buyer.
          </p>
        </div>
        
        <div className="buyer-container">
          {viewMode === 'options' && (
            <div className="buyer-options">
              <div className="option-card" onClick={() => setViewMode('createContract')}>
                <div className="option-icon">➕</div>
                <h3>Create Contract</h3>
                <p>Create a new service contract and find a seller</p>
              </div>
              
              <div className="option-card" onClick={() => setViewMode('viewContracts')}>
                <div className="option-icon">👁️</div>
                <h3>View Contracts</h3>
                <p>Explore and manage your contract details</p>
              </div>
              
              <div className="option-card" onClick={() => setViewMode('myContracts')}>
                <div className="option-icon">📝</div>
                <h3>My Contracts</h3>
                <p>Simple list of your existing contracts</p>
              </div>
              
              <div className="option-card" onClick={() => setViewMode('marketplace')}>
                <div className="option-icon">🏪</div>
                <h3>Marketplace</h3>
                <p>Browse and purchase items from the marketplace</p>
              </div>
            </div>
          )}
          
          {viewMode === 'createContract' && (
            <CreateContract 
              onBack={() => setViewMode('options')}
              onContractCreated={(contract) => {
                // Add the contract to user's contracts
                const newContract = {
                  ...contract,
                  id: userContracts.length + 1, // Simple ID for demo
                  status: 'active'
                };
                setUserContracts([...userContracts, newContract]);
                alert(`Contract created successfully: ${contract.name}`);
                setViewMode('myContracts');
              }}
            />
          )}
          
          {viewMode === 'myContracts' && (
            <MyContracts 
              onBack={() => setViewMode('options')}
              userContracts={userContracts}
              onContractSelected={(contract) => {
                // Handle contract selection
                console.log('Selected contract:', contract);
                // In a real app, you might navigate to a contract details page
                alert(`Contract details: ${contract.name}\nStatus: ${contract.status}\nPrice: ${contract.price} ${contract.paymentToken}`);
              }}
            />
          )}
          
          {viewMode === 'viewContracts' && (
            <div className="view-contracts-wrapper">
              <div className="section-header">
                <button onClick={() => setViewMode('options')} className="back-button">
                  &larr; Back
                </button>
                <h2>View & Manage Contracts</h2>
              </div>
              <ViewContracts userRole="buyer" />
            </div>
          )}
          
          {viewMode === 'marketplace' && (
            <div className="marketplace-section">
              <div className="section-header">
                <button onClick={() => setViewMode('options')} className="back-button">
                  &larr; Back
                </button>
                <h2>Marketplace</h2>
              </div>
              
              <div className="buyer-actions">
                <h3>Available Items</h3>
                
                {!isConnected ? (
                  <div className="connect-prompt">
                    <p>Please connect your wallet to view available items.</p>
                  </div>
                ) : loading ? (
                  <div className="loading-spinner">Loading items...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : items.length === 0 ? (
                  <div className="placeholder-content">
                    <p>No items currently available in the marketplace.</p>
                  </div>
                ) : (
                  <div className="items-grid">
                    {items.map((item) => (
                      <div key={item.id} className="item-card">
                        <h4>{item.name}</h4>
                        <p className="item-description">{item.description}</p>
                        <p className="item-price">{item.price} ETH</p>
                        <p className="item-seller">Seller: {item.seller.substring(0, 6)}...{item.seller.substring(38)}</p>
                        <button 
                          onClick={() => handleBuyItem(item.id, item.price)}
                          disabled={loading || item.seller.toLowerCase() === account.toLowerCase()}
                          className="buy-button"
                        >
                          {item.seller.toLowerCase() === account.toLowerCase() ? "You own this" : "Buy Now"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Buyer;
