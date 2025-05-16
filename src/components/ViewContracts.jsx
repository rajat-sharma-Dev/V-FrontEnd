import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { createContractFromConfig, formatContractStatus, formatAddress } from '../utils/contractHelpers';
import { getPaginatedItems, getTotalPages, getPageNumbers } from '../utils/paginationUtils';
import ContractDetails from './ContractDetails';
import './ViewContracts.css';

const ViewContracts = ({ userRole }) => {
  const { isConnected, account, chainId, signer } = useWeb3();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  
  // Filter by contract status (optional)
  const [statusFilter, setStatusFilter] = useState('all');
  
  // For pagination (if needed in the future)
  const [currentPage, setCurrentPage] = useState(1);
  const contractsPerPage = 5;
  
  // Load contracts on component mount and when account/chainId changes
  useEffect(() => {
    if (isConnected && account) {
      fetchContracts();
    }
  }, [isConnected, account, chainId, userRole, fetchContracts]);
  
  
  const fetchContracts = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create Factory contract instance
      const factoryContract = createContractFromConfig('CONTRACT_FACTORY', chainId, signer);
      if (!factoryContract) {
        throw new Error("Contract factory not available on this network");
      }
      
      // We'll use local storage as a temporary solution but structure the code to be
      // ready for real blockchain integration
      const mockData = getMockContracts();
      setContracts(mockData);
      
      // In a real blockchain implementation, this is how we would fetch contracts:
      // Different methods based on user role:
      if (isConnected && factoryContract) {
        try {
          console.log(`Fetching contracts for ${userRole} at address ${account}`);
          
          // These methods would be implemented in the smart contract
          // Currently commented out until the contract is deployed with these methods
          /*
          let contractAddresses = [];
          
          if (userRole === 'buyer') {
            contractAddresses = await factoryContract.getBuyerContracts(account);
          } else if (userRole === 'seller') {
            contractAddresses = await factoryContract.getSellerContracts(account);
          } else if (userRole === 'validator') {
            contractAddresses = await factoryContract.getDisputedContracts();
          }
          
          // Then fetch details for each contract
          const contractsData = await Promise.all(
            contractAddresses.map(async (address) => {
              const escrowContract = createContractFromConfig(
                'CONFIDENTIAL_ESCROW', 
                chainId, 
                signer, 
                address
              );
              
              // Get basic contract details
              const buyer = await escrowContract.buyer();
              const seller = await escrowContract.seller();
              const price = await escrowContract.amount();
              const status = await escrowContract.getStatus();
              
              // Format and return contract data
              return {
                contractAddress: address,
                buyerAddress: buyer,
                sellerAddress: seller,
                price: ethers.formatEther(price),
                status: formatStatus(status),
                // ...other contract details
              };
            })
          );
          
          setContracts(contractsData);
          */
        } catch (err) {
          console.error("Error fetching blockchain contracts:", err);
          // Fallback to mock data if blockchain fails
        }
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(err.message || "Failed to fetch contracts");
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get mock contracts (replace with actual contract data in production)
  const getMockContracts = () => {
    // For now, we'll simulate different contracts based on user role
    // In a real implementation, this would come from the blockchain
    
    const mockData = [];
    const today = new Date();
    
    // Get contracts from localStorage if any
    const storedContracts = localStorage.getItem('userContracts');
    if (storedContracts) {
      try {
        const parsedContracts = JSON.parse(storedContracts);
        
        // Filter by role
        if (userRole === 'buyer') {
          return parsedContracts.filter(c => c.buyerAddress === account);
        } else if (userRole === 'seller') {
          return parsedContracts.filter(c => c.sellerAddress === account);
        } else if (userRole === 'validator') {
          // For validators, show all contracts that are in dispute
          return parsedContracts.filter(c => c.status === 'disputed');
        }
        
        return parsedContracts;
      } catch (e) {
        console.error("Error parsing stored contracts:", e);
      }
    }
    
    // If no stored contracts or error, return some mock data
    if (userRole === 'buyer') {
      mockData.push(
        {
          id: '1',
          contractAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          sellerAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          buyerAddress: account,
          price: '1.2',
          status: 'active',
          conditions: [
            { title: 'Functionality', description: 'App should work as described', completed: false },
            { title: 'UI Design', description: 'Clean and responsive UI', completed: true }
          ],
          deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          contractAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          sellerAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          buyerAddress: account,
          price: '0.5',
          status: 'completed',
          conditions: [
            { title: 'Logo Design', description: 'Create company logo', completed: true }
          ],
          deadline: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      );
    } else if (userRole === 'seller') {
      mockData.push(
        {
          id: '3',
          contractAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          sellerAddress: account,
          buyerAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          price: '2.0',
          status: 'active',
          conditions: [
            { title: 'Backend Implementation', description: 'Implement API and database', completed: false },
            { title: 'Testing', description: 'Unit and integration tests', completed: false }
          ],
          deadline: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          contractAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          sellerAddress: account,
          buyerAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          price: '0.8',
          status: 'disputed',
          conditions: [
            { title: 'Content Creation', description: 'Create 10 blog posts', completed: true },
            { title: 'SEO Optimization', description: 'Keyword research and implementation', completed: false }
          ],
          deadline: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      );
    } else if (userRole === 'validator') {
      mockData.push(
        {
          id: '5',
          contractAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          sellerAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          buyerAddress: '0x' + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          price: '1.5',
          status: 'disputed',
          dispute: {
            reason: 'Quality issues',
            createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            votes: { buyer: 0, seller: 0 }
          },
          conditions: [
            { title: 'Smart Contract Audit', description: 'Complete security audit of contracts', completed: true },
            { title: 'Vulnerability Report', description: 'Detailed report of findings', completed: false }
          ],
          deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      );
    }
    
    return mockData;
  };
  
  // Function to handle contract selection for detailed view
  const handleContractSelect = (contract) => {
    setSelectedContract(contract);
  };
  
  // Function to handle closing the contract details
  const handleCloseDetails = () => {
    setSelectedContract(null);
    // Refresh contracts to get any updates
    fetchContracts();
  };
  
  // Filter contracts based on status
  const filteredContracts = statusFilter === 'all' 
    ? contracts 
    : contracts.filter(contract => contract.status === statusFilter);
  
  // Get paginated contracts
  const currentContracts = getPaginatedItems(filteredContracts, currentPage, contractsPerPage);
  
  // Get page numbers for pagination UI
  const totalPages = getTotalPages(filteredContracts, contractsPerPage);
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Display informative message when wallet is not connected
  const renderConnectionMessage = () => {
    if (!isConnected) {
      return (
        <div className="connection-message">
          <p>Please connect your wallet to view your contracts</p>
          <p className="helper-text">Connect using the wallet button in the top right corner</p>
        </div>
      );
    }
    
    if (isConnected && loading) {
      return (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading contracts...</p>
        </div>
      );
    }
    
    if (isConnected && error) {
      return (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchContracts} className="retry-btn">
            Retry
          </button>
        </div>
      );
    }
    
    return null;
  };
   if (loading) {
    return <div className="loading">Loading contracts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="view-contracts">
      <div className="contracts-header">
        <h2>{userRole === 'buyer' ? 'My Buyer Contracts' : 
             userRole === 'seller' ? 'My Seller Contracts' : 
             'Contracts in Dispute'}</h2>
        
        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button onClick={fetchContracts} className="refresh-btn">
            ↻ Refresh
          </button>
        </div>
      </div>
      
      {renderConnectionMessage()}
      
      {isConnected && contracts.length === 0 ? (
        <div className="no-contracts">
          <p>No contracts found. {userRole === 'buyer' ? 'Create a new contract to get started!' : ''}</p>
        </div>
      ) : (
        <div className="contracts-container">
          <div className="contracts-list">
            {currentContracts.map((contract) => (
              <div 
                key={contract.id} 
                className={`contract-card ${selectedContract && selectedContract.id === contract.id ? 'selected' : ''}`}
                onClick={() => handleContractSelect(contract)}
              >
                <div className="contract-header">
                  <div className="contract-id">ID: {contract.id}</div>
                  <div className={`contract-status status-${contract.status}`}>
                    {formatContractStatus(contract.status)}
                  </div>
                </div>
                
                <div className="contract-body">
                  <div className="contract-title">
                    {contract.conditions[0].title}
                    {contract.conditions.length > 1 ? ` + ${contract.conditions.length - 1} more` : ''}
                  </div>
                  
                  <div className="contract-price">
                    {contract.price} ETH
                  </div>
                  
                  <div className="contract-dates">
                    <div>Created: {formatDate(contract.createdAt)}</div>
                    <div>Deadline: {formatDate(contract.deadline)}</div>
                  </div>
                  
                  <div className="contract-progress">
                    <div className="progress-label">
                      Completion: {Math.round((contract.conditions.filter(c => c.completed).length / contract.conditions.length) * 100)}%
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${(contract.conditions.filter(c => c.completed).length / contract.conditions.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="contract-footer">
                  <button onClick={() => handleContractSelect(contract)} className="btn-view">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredContracts.length > contractsPerPage && (
            <div className="pagination">
              {pageNumbers.map((number, index) => (
                typeof number === 'number' ? (
                  <button
                    key={index}
                    onClick={() => paginate(number)}
                    className={currentPage === number ? 'active' : ''}
                  >
                    {number}
                  </button>
                ) : (
                  <span key={index} className="pagination-ellipsis">{number}</span>
                )
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Render ContractDetails component when a contract is selected */}
      {selectedContract && (
        <div className="contract-details-modal">
          <div className="modal-backdrop" onClick={() => handleCloseDetails()}></div>
          <div className="modal-content">
            <ContractDetails 
              contract={selectedContract} 
              onClose={handleCloseDetails} 
              userRole={userRole}
            />
          </div>
        </div>
      )}
      
      {/* Connection message section */}
      <div className="connection-message-container">
        {renderConnectionMessage()}
      </div>
    </div>
  );
};

export default ViewContracts;
