import { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import InteractContract from './InteractContract';
import SellerInteractContract from './SellerInteractContract';
import { CONTRACT_FACTORY, CONFIDENTIAL_ESCROW } from '../config/contractTypes';
import './MyContracts.css';

const MyContracts = ({ onBack, userContracts = [], onContractSelected, role = 'buyer' }) => {
  const { isConnected, chainId, account, signer } = useWeb3();
  const [contracts, setContracts] = useState(userContracts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  
  // First useEffect just to create the factory contract
  useEffect(() => {
    let isMounted = true;
    
    const createFactory = async () => {
      if (!isConnected || !chainId || !account || !signer) return;
      
      try {
        console.log("Creating factory contract instance for chain ID", chainId);
        
        // Check if chain ID is valid
        if (!chainId) {
          console.error("Chain ID is undefined or invalid");
          return;
        }
        
        // Create the factory contract instance
        const newFactoryContract = await createContractFromConfig(CONTRACT_FACTORY, chainId, signer);
        
        // Verify factory contract was created successfully
        if (!newFactoryContract) {
          console.error("Contract instance is null or undefined - check CONTRACT_FACTORY config");
          return;
        }
        
        console.log("Factory contract instance created successfully:", newFactoryContract.target);
        if (isMounted) {
          setFactoryContract(newFactoryContract);
        }
      } catch (error) {
        console.error("Error creating factory contract:", error);
      }
    };
    
    createFactory();
    
    return () => {
      isMounted = false;
    };
  }, [isConnected, chainId, account, signer]);
  
  // Separate useEffect for fetching contracts
  useEffect(() => {
    if (!factoryContract || !account) return;
    
    let isMounted = true;
    let timeoutId;
    
    // Add a cleanup function for resources
    const cleanupResources = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      isMounted = false;
    };
    
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.log('Contract loading timed out after 15 seconds');
        setLoading(false);
        setError('Loading contracts timed out. Please try again later.');
      }
    }, 15000); // 15 second timeout
    
    const fetchContracts = async () => {
      if (!isMounted) return; // Cancel if component is unmounted
      setLoading(true);
      setContracts([]);
      setError(null);
      
      try {
        // Directly call the appropriate factory contract method based on role
        let contractAddresses = [];
        if (role === 'seller') {
          console.log(`Fetching contracts for seller: ${account}`);
          contractAddresses = await factoryContract.getEscrowAddressesOfSeller(account);
        } else {
          console.log(`Fetching contracts for buyer: ${account}`);
          contractAddresses = await factoryContract.getEscrowAddressOfBuyer(account);
        }
        
        console.log("Contract addresses returned:", contractAddresses);
        
        if (contractAddresses && contractAddresses.length > 0) {
          // Process the contract addresses to get full contract details
          const fetchedContracts = await processContractAddresses(contractAddresses);
          if (isMounted) {
            setContracts(fetchedContracts);
            console.log("Contracts fetched successfully:", fetchedContracts);
          }
        } else {
          console.log("No contracts found for this account");
          if (isMounted) {
            setContracts([]);
          }
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
        if (isMounted) {
          setError(`Failed to fetch contracts: ${error.message}`);
          setContracts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Process contract addresses to get full contract details
    const processContractAddresses = async (addresses) => {
      console.log("Processing contract addresses:", addresses);
      
      // Filter for valid contract addresses (should be 42 chars for Ethereum addresses)
      const validAddresses = addresses.filter(addr => 
        typeof addr === 'string' && addr.startsWith('0x') && addr.length === 42
      );
      
      if (validAddresses.length === 0) {
        console.log("No valid contract addresses found after filtering");
        return [];
      }
      
      // Process each contract address
      return await Promise.all(
        validAddresses.map(async (address, index) => {
          console.log(`Processing contract at address: ${address}`);
          // Create escrow contract instance
          try {
            // Small delay between processing contracts to avoid overwhelming the provider
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // For CONFIDENTIAL_ESCROW, we always pass the specific address
            const escrowContract = await createContractFromConfig(
              CONFIDENTIAL_ESCROW, 
              chainId, 
              signer, 
              address
            );
            
            if (!escrowContract) {
              console.error(`Failed to create contract instance for ${address}`);
              return {
                id: index + 1,
                contractAddress: address,
                sellerAddress: "Could not load",
                buyerAddress: "Could not load",
                price: "0",
                status: "unknown",
                conditions: [],
                createdAt: new Date().toISOString(),
                error: "Failed to create contract instance"
              };
            }
            
            // Get contract info
            const contractInfo = await escrowContract.getContractInfo();
            console.log(`Contract info for ${address}:`, contractInfo);
            
            // contractInfo is an array with the following structure:
            // [0]: buyer address
            // [1]: seller address
            // [2]: total amount (price)
            // [3]: status code (0=pending, 1=active, 2=completed)
            // [4]: condition keys array
            
            // Map status code to readable status
            const statusMap = {
              0: "pending",
              1: "active",
              2: "completed"
            };
            
            // Format price and created date with appropriate error handling
            const price = contractInfo[2] ? ethers.formatEther(contractInfo[2]) : "0";
            // Use current date as fallback for createdAt since it's not returned by the contract
            const createdAt = new Date().toISOString();
            
            return {
              id: index + 1,
              contractAddress: address,
              sellerAddress: contractInfo[1] || "Unknown",
              buyerAddress: contractInfo[0] || "Unknown",
              price: price,
              status: statusMap[Number(contractInfo[3])] || "unknown",
              conditions: [], // We'll need to fetch conditions separately if needed
              createdAt: createdAt,
            };
          } catch (error) {
            console.error(`Error processing contract at ${address}:`, error);
            return {
              id: index + 1,
              contractAddress: address,
              sellerAddress: "Error loading",
              buyerAddress: "Error loading",
              price: "0",
              status: "error",
              conditions: [],
              createdAt: new Date().toISOString(),
              error: error.message
            };
          }
        })
      );
    };
    
    fetchContracts();
    
    return () => {
      cleanupResources();
    };
  }, [factoryContract, account, role, chainId, signer]); // Only depend on these essential dependencies

  // Set up WebSocket listener for new contracts - separated from the main fetch effect
  useEffect(() => {
    if (!isConnected || !account || !chainId || !signer || !factoryContract) return;
    
    console.log("Setting up contract event listeners...");
    
    // This function is currently unused but will be used when the event listener is activated
    // eslint-disable-next-line no-unused-vars
    const handleNewContract = async (seller, buyer, contractAddress, _event) => {
      console.log("New contract created:", { seller, buyer, contractAddress });
      
      // Check if this contract is relevant to the current user based on their role
      const isRelevant = (role === 'seller' && seller.toLowerCase() === account.toLowerCase()) ||
                         (role === 'buyer' && buyer.toLowerCase() === account.toLowerCase());
      
      if (isRelevant) {
        try {
          // Create escrow contract instance to get details
          const escrowContract = createContractFromConfig(
            CONFIDENTIAL_ESCROW, 
            chainId, 
            signer, 
            contractAddress
          );
          
          // Get contract details
          const contractInfo = await escrowContract.getContractInfo();
          
          // Add to contracts state
          setContracts(prevContracts => {
            // Check if contract already exists
            const exists = prevContracts.some(c => 
              c.contractAddress.toLowerCase() === contractAddress.toLowerCase()
            );
            
            if (exists) return prevContracts;
            
            // Add new contract
            const newContract = {
              id: prevContracts.length + 1,
              contractAddress: contractAddress,
              sellerAddress: contractInfo.seller,
              buyerAddress: contractInfo.buyer,
              price: ethers.formatEther(contractInfo.price),
              status: contractInfo.status,
              conditions: contractInfo.conditions || [],
              createdAt: new Date(contractInfo.createdAt * 1000).toISOString(),
            };
            
            return [...prevContracts, newContract];
          });
        } catch (error) {
          console.error("Error handling new contract event:", error);
        }
      }
    };
    
    // Set up the listener (if the contract supports events)
    // Uncomment when the Factory contract has implemented the ContractCreated event
    /*
    try {
      factoryContract.on('ContractCreated', handleNewContract);
      console.log('WebSocket listener for new contracts set up');
      
      // Clean up function
      return () => {
        factoryContract.off('ContractCreated', handleNewContract);
        console.log('WebSocket listener for new contracts removed');
      };
    } catch (error) {
      console.error("Error setting up contract event listener:", error);
    }
    */
  }, [factoryContract]); // Only re-run when factoryContract changes

  // Filter contracts based on selected filter
  const filteredContracts = contracts.filter(contract => {
    if (selectedFilter === 'all') return true;
    return contract.status === selectedFilter;
  });
  
  const handleViewContract = (contract) => {
    // Set the contractType to CONFIDENTIAL_ESCROW when selecting a contract for interaction
    const contractWithType = {
      ...contract,
      contractType: CONFIDENTIAL_ESCROW
    };
    
    setSelectedContract(contractWithType);
    
    // Also call the external handler if provided
    if (onContractSelected) {
      onContractSelected(contractWithType);
    }
  };
  
  // Format timestamp with enhanced details
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    // If less than 1 day ago, show relative time
    if (diffDays < 1) {
      if (diffHrs < 1) {
        if (diffMins < 1) {
          return "Just now";
        }
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
      }
      return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
    } 
    // If less than 7 days ago, show day of week and time
    else if (diffDays < 7) {
      const options = { weekday: 'short', hour: 'numeric', minute: 'numeric' };
      return date.toLocaleString(undefined, options);
    }
    // Otherwise show full date
    else {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
      return date.toLocaleString(undefined, options);
    }
  };
  
  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Calculate completion percentage
  const calculateCompletion = (conditions) => {
    if (!conditions || conditions.length === 0) return 0;
    const completed = conditions.filter(c => c.completed).length;
    return Math.round((completed / conditions.length) * 100);
  };
  
  // Calculate contract summary statistics
  const contractSummary = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        disputed: 0,
        pending: 0,
        totalValue: BigInt(0),
        averageValue: BigInt(0),
        largestContract: BigInt(0),
        completionRate: 0
      };
    }
    
    // Count contracts by status
    const statusCounts = contracts.reduce((counts, contract) => {
      counts[contract.status] = (counts[contract.status] || 0) + 1;
      return counts;
    }, {});
    
    // Calculate total value of all contracts (handle both string and BigNumber values)
    const totalValue = contracts.reduce((sum, contract) => {
      // Ensure we have a valid price
      if (!contract.price) return sum;
      
      try {
        let contractValue;
        // Handle if price is already a BigNumber
        if (typeof contract.price === 'object' && contract.price._isBigNumber) {
          contractValue = contract.price;
        } else {
          // Handle if price is a string (possibly with ETH units)
          contractValue = ethers.parseEther(contract.price.toString());
        }
        
        // Use numeric operation instead of BigNumber methods
        return BigInt(sum) + BigInt(contractValue);
      } catch (error) {
        console.warn("Error parsing contract price:", error);
        return sum;
      }
    }, BigInt(0));
    
    // Find largest contract value
    let largestContract = BigInt(0);
    contracts.forEach(contract => {
      if (!contract.price) return;
      
      try {
        let contractValue;
        if (typeof contract.price === 'object' && contract.price._isBigNumber) {
          contractValue = BigInt(contract.price.toString());
        } else {
          contractValue = ethers.parseEther(contract.price.toString());
        }
          
        if (contractValue > largestContract) {
          largestContract = contractValue;
        }
      } catch (error) {
        console.warn("Error parsing contract price for largest contract calculation:", error);
      }
    });
    
    // Calculate completion rate (completed contracts / total contracts)
    const completedCount = statusCounts.completed || 0;
    const completionRate = contracts.length > 0 
      ? (completedCount / contracts.length) * 100 
      : 0;
    
    // Calculate average value
    const averageValue = contracts.length > 0
      ? totalValue / BigInt(contracts.length)
      : BigInt(0);
    
    return {
      total: contracts.length,
      active: statusCounts.active || 0,
      completed: completedCount,
      disputed: statusCounts.disputed || 0,
      pending: statusCounts.pending || 0,
      totalValue,
      averageValue,
      largestContract,
      completionRate
    };
  }, [contracts]);
  
  const handleSelectContract = async (contractAddress) => {
    console.log("Selected contract address:", contractAddress);
    
    try {
      // Pass the contract information to InteractContract
      // Send contract address and type, but let InteractContract handle instance creation
      setSelectedContract({
        contractAddress,
        contractType: CONFIDENTIAL_ESCROW, // Use the constant from contractTypes.js
      });
    } catch (error) {
      console.error("Error selecting contract:", error);
      setSelectedContract(null);
    }
  };
  
  return (
    <div className="contracts-container">
      <div className="contracts-header">
        <h2>{role === 'seller' ? 'Your Selling Contracts' : 'Your Buying Contracts'}</h2>
        <button className="back-button" onClick={onBack}>Back</button>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your contracts... This may take a moment.</p>
          <p className="loading-hint">If this takes too long, check your wallet connection and try again.</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <h3>Error Loading Contracts</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : selectedContract ? (
        role === 'seller' ? (
          <SellerInteractContract 
            contractDetails={selectedContract} 
            onBack={() => setSelectedContract(null)}
            onContractUpdated={(updatedContract) => {
              // Update the contract in the list when it changes
              const updatedContracts = contracts.map(c => 
                c.id === updatedContract.id ? updatedContract : c
              );
              setContracts(updatedContracts);
              setSelectedContract(null);
            }}
          />
        ) : (
          <InteractContract 
            contract={selectedContract} 
            onBack={() => setSelectedContract(null)} 
            onContractUpdated={(updatedContract) => {
              // Update the contract in the list when it changes
              const updatedContracts = contracts.map(c => 
                c.id === updatedContract.id ? updatedContract : c
              );
              setContracts(updatedContracts);
              setSelectedContract(null);
            }}
          />
        )
      ) : (
        <div className="contracts-main-content">
          {/* Contract summary cards */}
          <div className="contracts-summary">
            <div className="summary-card">
              <div className="summary-title">Total Contracts</div>
              <div className="summary-value">{contracts.length}</div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Active Contracts</div>
              <div className="summary-value">
                {contracts.filter(c => c.status === 'active').length}
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Completed</div>
              <div className="summary-value">
                {contracts.filter(c => c.status === 'completed').length}
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Completion Rate</div>
              <div className="summary-value">
                {contractSummary.completionRate.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="contract-filters">
            <button 
              className={`filter-button ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-button ${selectedFilter === 'active' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('active')}
            >
              In Progress
            </button>
            <button 
              className={`filter-button ${selectedFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('completed')}
            >
              Completed
            </button>
            <button 
              className={`filter-button ${selectedFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-button ${selectedFilter === 'disputed' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('disputed')}
            >
              Disputed
            </button>
          </div>
          
          {filteredContracts.length === 0 ? (
            <div className="empty-contracts">
              <p>No contracts found with the selected filter.</p>
              {contracts.length === 0 && (
                <div className="no-contracts-message">
                  <p>You don't have any contracts yet.</p>
                  {role === 'buyer' && (
                    <button className="create-contract-button" onClick={() => onBack()}>
                      Create a New Contract
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="contracts-list">
              {filteredContracts.map((contract) => (
                <div key={contract.id || contract.contractAddress} className={`contract-card ${contract.status || ''}`}>
                  <div className="contract-header">
                    <div className="contract-id">Contract #{contract.id || contract.contractAddress.substring(0, 6)}</div>
                    {contract.status && (
                      <span className={`status-badge ${contract.status}`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    )}
                  </div>
                  
                  <div className="contract-details">
                    <div className="detail-row">
                      <div className="detail-label">{role === 'seller' ? 'Buyer:' : 'Seller:'}</div>
                      <div className="detail-value address">
                        {formatAddress(role === 'seller' ? contract.buyerAddress : contract.sellerAddress)}
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-label">Confirmations:</div>
                      <div className="detail-value confirmations">
                        <span className="confirmation-count">
                          {contract.conditions ? 
                            `${contract.conditions.filter(c => c.completed).length}/${contract.conditions.length}` : 
                            "0/0"}
                          {contract.conditions && contract.conditions.length > 0 && (
                            <span className="percentage">
                              {` (${calculateCompletion(contract.conditions)}%)`}
                            </span>
                          )}
                        </span>
                        <div className="progress-bar">
                          <div 
                            className="progress" 
                            style={{ width: `${calculateCompletion(contract.conditions)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-label">Total Amount:</div>
                      <div className="detail-value amount">
                        {contract.price} {contract.tokenSymbol || contract.paymentTokenSymbol || 
                        (contract.paymentToken !== "0x1111111111111111111111111111111111111111" ? 
                          contract.paymentToken : "")}
                        {contract.totalAdvancePayment && parseFloat(contract.totalAdvancePayment) > 0 && (
                          <span className="advance-payment">
                            (Advance: {contract.totalAdvancePayment})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-label">Created:</div>
                      <div className="detail-value">{formatDate(contract.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className="contract-actions">
                    <button 
                      onClick={() => handleViewContract(contract)} 
                      className="interact-button"
                    >
                      Interact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyContracts;
