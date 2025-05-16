import { useNavigate } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';
import Navigation from '../components/Navigation';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="app-header">
        <h1>Smart Contract Frontend</h1>
        <WalletConnect />
      </header>
      <Navigation />
      
      <main className="main-content">
        <div className="character-selection">
          <h2>Choose Your Role</h2>
          
          <div className="character-grid">
            <div className="character-card" onClick={() => navigate('/buyer')}>
              <div className="character-avatar buyer-avatar">
                <span className="avatar-icon">🛒</span>
              </div>
              <h3>Buyer</h3>
              <p>Browse the marketplace, purchase items and manage your contracts</p>
              <div className="character-details">
                <div className="character-trait">
                  <span className="trait-label">Role:</span>
                  <span className="trait-value">Contract Consumer</span>
                </div>
                <div className="character-trait">
                  <span className="trait-label">Abilities:</span>
                  <span className="trait-value">Browse, Purchase, Evaluate</span>
                </div>
                <div className="character-trait">
                  <span className="trait-label">Rewards:</span>
                  <span className="trait-value">Quality Products & Services</span>
                </div>
              </div>
              <button className="select-button">Select Buyer</button>
            </div>
            
            <div className="character-card" onClick={() => navigate('/seller')}>
              <div className="character-avatar seller-avatar">
                <span className="avatar-icon">💼</span>
              </div>
              <h3>Seller</h3>
              <p>List your products and services on the marketplace</p>
              <div className="character-details">
                <div className="character-trait">
                  <span className="trait-label">Role:</span>
                  <span className="trait-value">Contract Provider</span>
                </div>
                <div className="character-trait">
                  <span className="trait-label">Abilities:</span>
                  <span className="trait-value">Create, List, Fulfill</span>
                </div>
                <div className="character-trait">
                  <span className="trait-label">Rewards:</span>
                  <span className="trait-value">ETH & Token Earnings</span>
                </div>
              </div>
              <button className="select-button">Select Seller</button>
            </div>
            
            <div className="character-card" onClick={() => navigate('/validator')}>
              <div className="character-avatar validator-avatar">
                <span className="avatar-icon">⚖️</span>
              </div>
              <h3>Validator</h3>
              <p>Vote on disputes and earn rewards for maintaining the marketplace</p>
              <div className="character-details">
                <div className="character-trait">
                  <span className="trait-label">Role:</span>
                  <span className="trait-value">Network Guardian</span>
                </div>
                <div className="character-trait">
                  <span className="trait-label">Abilities:</span>
                  <span className="trait-value">Vote, Stake, Earn</span>
                </div>
                <div className="character-trait">
                  <span className="trait-label">Rewards:</span>
                  <span className="trait-value">CDT Tokens & Influence</span>
                </div>
              </div>
              <button className="select-button">Select Validator</button>
            </div>
          </div>
          
          <div className="swap-portal">
            <div className="portal-content" onClick={() => navigate('/swap')}>
              <div className="portal-icon">🔄</div>
              <div className="portal-text">
                <h3>Token Swap Portal</h3>
                <p>Need to exchange tokens? Use our swap interface.</p>
              </div>
              <button className="portal-button">Enter Portal</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
