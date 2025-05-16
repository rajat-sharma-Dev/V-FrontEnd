import { useState, useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';
import Navigation from '../components/Navigation';
import MyContracts from '../components/MyContracts';
import ViewContracts from '../components/ViewContracts';
import { useWeb3 } from '../hooks/useWeb3';
import { createContractFromConfig } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import './Buyer.css'; // Reuse buyer styles

const Seller = () => {
  const { isConnected, chainId, signer, account } = useWeb3();
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('options'); // options, myContracts, viewContracts, marketplace
  const [userContracts, setUserContracts] = useState([]);

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  
  // Load user contracts from localStorage when account changes
  useEffect(() => {
    if (account) {
      const savedContracts = localStorage.getItem(`seller-contracts-${account}`);
      if (savedContracts) {
        setUserContracts(JSON.parse(savedContracts));
      } else {
        // For demonstration, initialize with mock seller contracts
        const mockSellerContracts = [
          {
            id: 1,
            buyerAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            price: "0.5",
            totalAdvancePayment: "0.1",
            paymentToken: "Native Token",
            deliveryDays: 14,
            contractAddress: "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
            timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
            status: "active",
            conditions: [
              { title: "Homepage Design", description: "Create wireframes for homepage", completed: true },
              { title: "About Us Page", description: "Design and implement About Us page", completed: false, advancePayment: true, advanceAmount: "0.05" },
              { title: "Contact Form", description: "Create a functional contact form", completed: false, advancePayment: true, advanceAmount: "0.05" }
            ]
          },
          {
            id: 2,
            buyerAddress: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
            price: "1.2",
            totalAdvancePayment: "0.4",
            paymentToken: "USDC",
            deliveryDays: 5,
            contractAddress: "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
            status: "pending",
            conditions: [
              { title: "Code Audit", description: "Review smart contract code", completed: false, advancePayment: true, advanceAmount: "0.2" },
              { title: "Security Analysis", description: "Perform security analysis", completed: false, advancePayment: false },
              { title: "Final Report", description: "Deliver comprehensive report", completed: false, advancePayment: true, advanceAmount: "0.2" }
            ]
          },
          {
            id: 3,
            buyerAddress: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
            price: "0.8",
            totalAdvancePayment: "0.2",
            paymentToken: "Native Token",
            deliveryDays: 10,
            contractAddress: "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
            timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
            status: "disputed",
            conditions: [
              { title: "Concept Design", description: "Create concept designs for NFTs", completed: true },
              { title: "Initial Artwork", description: "Create rough drafts for 10 NFTs", completed: true },
              { title: "Final Deliverables", description: "Deliver high-resolution artwork", completed: false, advancePayment: true, advanceAmount: "0.2" }
            ]
          },
        ];
        setUserContracts(mockSellerContracts);
      }
    } else {
      setUserContracts([]);
    }
  }, [account]);
  
  // Save contracts to localStorage when they change
  useEffect(() => {
    if (account && userContracts.length > 0) {
      localStorage.setItem(`seller-contracts-${account}`, JSON.stringify(userContracts));
    }
  }, [userContracts, account]);

  // Initialize marketplace contract when connected
  useEffect(() => {
    if (isConnected && chainId && signer) {
      const contract = createContractFromConfig('MARKETPLACE', chainId, signer);
      setMarketplaceContract(contract);
    } else {
      setMarketplaceContract(null);
      setMyListings([]);
    }
  }, [isConnected, chainId, signer]);

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
          } catch (err) {
            console.error(`Error loading item ${i}:`, err);
          }
        }

        setMyListings(userItems);
        setLoading(false);
      } catch (err) {
        console.error("Error loading user listings:", err);
        setError("Failed to load your listings");
        setLoading(false);
      }
    };

    loadUserListings();
  }, [marketplaceContract, account]);

  const handleCreateListing = async (e) => {
    e.preventDefault();
    
    if (!marketplaceContract || !isConnected) return;
    
    if (!itemName || !itemDescription || !itemPrice || parseFloat(itemPrice) <= 0) {
      setError("Please fill out all fields with valid values");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(itemPrice);
      
      // Create listing transaction
      const tx = await marketplaceContract.listItem(
        itemName,
        itemDescription,
        priceInWei
      );
      
      await tx.wait();
      
      // Reset form
      setItemName('');
      setItemDescription('');
      setItemPrice('');
      
      // Refresh listings
      const itemCount = await marketplaceContract.getItemCount();
      const newItemId = parseInt(itemCount.toString());
      const newItem = await marketplaceContract.getItemDetails(newItemId);
      
      setMyListings([...myListings, {
        id: newItemId,
        name: newItem.name,
        description: newItem.description,
        price: ethers.formatEther(newItem.price),
        sold: newItem.sold
      }]);
      
      setLoading(false);
    } catch (err) {
      console.error("Error creating listing:", err);
      setError("Transaction failed: " + err.message);
      setLoading(false);
    }
  };

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
            Manage your contracts and marketplace listings as a seller.
          </p>
        </div>
        
        <div className="buyer-container"> {/* Reusing buyer container styling */}
          {!isConnected ? (
            <div className="connect-prompt">
              <p>Please connect your wallet to access seller functions.</p>
            </div>
          ) : (
            <>
              {viewMode === 'options' && (
                <div className="buyer-options">
                  <div className="option-card" onClick={() => setViewMode('viewContracts')}>
                    <div className="option-icon">👁️</div>
                    <h3>View Contracts</h3>
                    <p>Explore and manage your service contracts in detail</p>
                  </div>
                  
                  <div className="option-card" onClick={() => setViewMode('myContracts')}>
                    <div className="option-icon">📝</div>
                    <h3>Simple Contracts</h3>
                    <p>Basic list of your service contracts</p>
                  </div>
                  
                  <div className="option-card" onClick={() => setViewMode('marketplace')}>
                    <div className="option-icon">🏪</div>
                    <h3>My Marketplace</h3>
                    <p>Manage your listings and create new ones</p>
                  </div>
                </div>
              )}
              
              {viewMode === 'myContracts' && (
                <MyContracts 
                  onBack={() => setViewMode('options')}
                  userContracts={userContracts}
                  role="seller"
                  onContractSelected={(contract) => {
                    // Handle contract selection
                    console.log('Selected contract:', contract);
                    // We don't need this alert since we're using the interactive components
                  }}
                />
              )}
              
              {viewMode === 'viewContracts' && (
                <div className="view-contracts-wrapper">
                  <div className="section-header">
                    <button onClick={() => setViewMode('options')} className="back-button">
                      &larr; Back
                    </button>
                    <h2>Manage Seller Contracts</h2>
                  </div>
                  <ViewContracts userRole="seller" />
                </div>
              )}
              
              {viewMode === 'marketplace' && (
                <div className="marketplace-section">
                  <div className="section-header">
                    <button onClick={() => setViewMode('options')} className="back-button">
                      &larr; Back
                    </button>
                    <h2>My Marketplace</h2>
                  </div>
                  
                  <div className="seller-actions">
                    <h3>Your Listings</h3>
                    {loading && <div className="loading-spinner">Loading your listings...</div>}
                    {error && <div className="error-message">{error}</div>}
                    
                    {!loading && myListings.length === 0 ? (
                      <div className="placeholder-content">
                        <p>You don't have any items listed yet. Create your first listing below.</p>
                      </div>
                    ) : (
                      <div className="seller-listings">
                        {myListings.map((item) => (
                          <div key={item.id} className="item-card">
                            <div className="listing-header">
                              <h4>{item.name}</h4>
                              <span className={`status-badge ${item.sold ? 'sold' : 'active'}`}>
                                {item.sold ? 'Sold' : 'Active'}
                              </span>
                            </div>
                            <p className="item-description">{item.description}</p>
                            <p className="item-price">{item.price} ETH</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="create-listing-section">
                      <h3>Create New Listing</h3>
                      <form onSubmit={handleCreateListing} className="create-listing-form">
                        <div className="form-group">
                          <label htmlFor="itemName">Item Name</label>
                          <input
                            id="itemName"
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="Enter item name"
                            disabled={loading}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="itemDescription">Description</label>
                          <textarea
                            id="itemDescription"
                            value={itemDescription}
                            onChange={(e) => setItemDescription(e.target.value)}
                            placeholder="Describe your item"
                            disabled={loading}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="itemPrice">Price (ETH)</label>
                          <input
                            id="itemPrice"
                            type="number"
                            value={itemPrice}
                            onChange={(e) => setItemPrice(e.target.value)}
                            placeholder="0.01"
                            step="0.000001"
                            min="0.000001"
                            disabled={loading}
                            required
                          />
                        </div>
                        
                        <button type="submit" disabled={loading} className="create-listing-btn">
                          {loading ? 'Creating...' : 'Create Listing'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Seller;
