import { useState, useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';
import Navigation from '../components/Navigation';
import MyContracts from '../components/MyContracts';
import { useWeb3 } from '../hooks/useWeb3';
import './Buyer.css'; // Reuse buyer styles

const Seller = () => {
  const { isConnected, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('options'); // options, myContracts
  const [userContracts, setUserContracts] = useState([]);
  
  // Removed localStorage dependency - contracts will be fetched directly from blockchain
  // in the MyContracts component

  // Load user's listings when contract is initialized
  useEffect(() => {
    const loadUserListings = async () => {
      if (!marketplaceContract || !account) return;

      try {
        setLoading(true);
        setError(null);

        // Get item count from contract
        const itemCount = await marketplaceContract.getItemCount();
        const totalItems = parseInt(itemCount.toString());
        
        // Load each item that belongs to the user
        const userItems = [];
        for (let i = 1; i <= totalItems; i++) {
          try {
            const item = await marketplaceContract.getItemDetails(i);
            if (item.seller.toLowerCase() === account.toLowerCase()) {
              userItems.push({
                id: i,
                name: item.name,
                description: item.description,
                price: ethers.formatEther(item.price),
                sold: item.sold
              });
            }
          } catch (e) {
            console.error(`Error getting item ${i}:`, e);
          }
        }
        
        setUserItems(userItems);
      } catch (error) {
        console.error("Error loading items:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (viewMode === 'myListings') {
      loadUserListings();
    }
  }, [viewMode, marketplaceContract, account]);
  
  return (
    <div className="page-container">
      <header className="app-header">
        <h1>Seller Dashboard</h1>
        <WalletConnect />
      </header>
      <Navigation />
      
      <main className="main-content">
        <div className="intro-section">
          <h2>Seller Interface</h2>
          <p>
            Manage your contracts with buyers and deliver services.
          </p>
        </div>
        
        <div className="buyer-container">
          {viewMode === 'options' && (
            <div className="buyer-options">
              <div className="option-card" onClick={() => setViewMode('myContracts')}>
                <div className="option-icon">📝</div>
                <h3>My Contracts</h3>
                <p>View and manage your existing contracts</p>
              </div>
              
              <div className="option-card" onClick={() => setViewMode('myListings')}>
                <div className="option-icon">📋</div>
                <h3>My Listings</h3>
                <p>Manage your service listings</p>
              </div>
            </div>
          )}
          
          {viewMode === 'myContracts' && (
            <MyContracts 
              onBack={() => setViewMode('options')} 
              role="seller"
            />
          )}
          
          {viewMode === 'myListings' && (
            <div className="section-container">
              <button className="back-button" onClick={() => setViewMode('options')}>Back</button>
              <h3>My Service Listings</h3>
              
              {loading && <p>Loading your listings...</p>}
              {error && <p className="error-message">Error: {error}</p>}
              
              {userItems && userItems.length > 0 ? (
                <div className="listings-grid">
                  {userItems.map(item => (
                    <div key={item.id} className="listing-card">
                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                      <p className="price">{item.price} ETH</p>
                      <p className="status">{item.sold ? 'Sold' : 'Available'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>You don't have any listings yet.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Seller;
