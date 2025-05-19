import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { createContractFromConfig, formatContractStatus, formatAddress } from '../utils/contractHelpers';
import { getPaginatedItems, getTotalPages, getPageNumbers } from '../utils/paginationUtils';
import { getBuyerContracts, getSellerContracts, getAllContracts } from '../utils/escrowHelpers';
import { ethers } from 'ethers';
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
  
  // Create fetchContracts function with useCallback to avoid dependency loop
  const fetchContracts = useCallback(async () => {
    if (!isConnected || !account || !chainId || !signer) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Create Factory contract instance
      const factoryContract = createContractFromConfig('CONTRACT_FACTORY', chainId, signer);
      if (!factoryContract) {
        throw new Error("Contract factory not available on this network");
      }
      
      // Fetch contracts based on user role
      let contractAddresses = [];
      
      if (userRole === 'buyer') {
        contractAddresses = await getBuyerContracts(factoryContract, account, signer);
      } else if (userRole === 'seller') {
        contractAddresses = await getSellerContracts(factoryContract, account, signer);
      } else if (userRole === 'validator') {
        // For validators, we could get all contracts and filter for disputed ones
        // This depends on what functionality the factory contract provides
        contractAddresses = await getAllContracts(factoryContract, signer);
      }
      
      if (contractAddresses.length === 0) {
        setContracts([]);
        setLoading(false);
        return;
      }
      
      // Then fetch details for each contract
      const contractsData = await Promise.all(
        contractAddresses.map(async (address, index) => {
          const escrowContract = createContractFromConfig(
            'CONFIDENTIAL_ESCROW', 
            chainId, 
            signer, 
            address
          );
          
          // Get basic contract details
          // Use getContractInfo which returns all basic info including the status
          const contractInfo = await escrowContract.getContractInfo();
          const buyer = contractInfo[0]; // buyer is at index 0
          const seller = contractInfo[1]; // seller is at index 1
          const amount = contractInfo[2]; // total amount is at index 2
          const statusCode = contractInfo[3]; // status is at index 3
          
          // Map contract status to our frontend status
          const statusMap = {
            0: 'pending', // IN_PROGRESS
            1: 'active',  // FUNDS_LOCKED
            2: 'completed' // COMPLETE
          };
          
          const status = statusMap[statusCode] || 'unknown';
          
          // Format and return contract data
          return {
            id: index + 1,
            contractAddress: address,
            buyerAddress: buyer,
            sellerAddress: seller,
            price: ethers.formatEther(amount),
            status,
            conditions: [
              { title: "Condition 1", description: "First deliverable", completed: status === 'completed' },
              { title: "Condition 2", description: "Second deliverable", completed: status === 'completed' }
            ],
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          };
        })
      );
      
      setContracts(contractsData);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(err.message || "Failed to fetch contracts");
      // Generate mock data if we can't fetch from blockchain
      setContracts(getMockContracts());
    } finally {
      setLoading(false);
    }
  }, [isConnected, account, chainId, signer, userRole]);
  
  // Load contracts on component mount and when account/chainId changes
  useEffect(() => {
    if (isConnected && account) {
      fetchContracts();
    }
  }, [isConnected, account, chainId, userRole, fetchContracts]);
  
  // Helper function to get mock contracts (only used as fallback)
  const getMockContracts = () => {
    // For now, we'll simulate different contracts based on user role
    const mockData = [];
    const today = new Date();
    
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
