import { useState, useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';
import Navigation from '../components/Navigation';
import CreateContract from '../components/CreateContract';
import MyContracts from '../components/MyContracts';
import { useWeb3 } from '../hooks/useWeb3';
import './Buyer.css';

const Buyer = () => {
  const { isConnected, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('options'); // options, createContract, myContracts
  const [userContracts, setUserContracts] = useState([]);
  
  // Removed localStorage dependency - contracts will be fetched directly from blockchain
  // in the MyContracts component

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
              
              <div className="option-card" onClick={() => setViewMode('myContracts')}>
                <div className="option-icon">📝</div>
                <h3>My Contracts</h3>
                <p>View and manage your existing contracts</p>
              </div>
            </div>
          )}
          
          {viewMode === 'createContract' && (
            <CreateContract 
              onBack={() => setViewMode('options')} 
              onContractCreated={(contract) => {
                setUserContracts([...userContracts, contract]);
                setViewMode('myContracts');
              }} 
            />
          )}
          
          {viewMode === 'myContracts' && (
            <MyContracts 
              onBack={() => setViewMode('options')} 
              role="buyer"
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Buyer;
