import { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { ethers } from 'ethers';
import { createContractFromConfig } from '../utils/contractHelpers';
import { getSellerContracts, getBuyerContracts } from '../utils/escrowHelpers';
import InteractContract from './InteractContract';
import SellerInteractContract from './SellerInteractContract';
import './MyContracts.css';

const MyContracts = ({ onBack, userContracts = [], onContractSelected, role = 'buyer' }) => {
  const { isConnected, chainId, account, signer } = useWeb3();
  const [contracts, setContracts] = useState(userContracts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!isConnected || !account || !chainId || !signer) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Check if we already have contract data passed from parent component
        if (userContracts.length > 0) {
          setContracts(userContracts);
          setLoading(false);
          return;
        }
        
        // Create Factory contract instance
        const factoryContractInstance = createContractFromConfig('CONTRACT_FACTORY', chainId, signer);
        if (!factoryContractInstance) {
          throw new Error("Contract factory not available on this network");
        }
        
        // Set the factory contract state
        setFactoryContract(factoryContractInstance);
        
        console.log(`Fetching contracts for ${role} role at address ${account}`);
        
        // Temporary: use localStorage to avoid losing data between page refreshes
        // In a production environment, this would be replaced with blockchain queries
        const storageKey = role === 'seller' ? `seller-contracts-${account}` : `buyer-contracts-${account}`;
        const savedContracts = localStorage.getItem(storageKey);
        
        if (savedContracts) {
          const parsedContracts = JSON.parse(savedContracts);
          setContracts(parsedContracts);
          setLoading(false);
          
          // We still try to fetch from blockchain if possible
          try {
            await fetchContractsFromBlockchain(factoryContractInstance);
          } catch (error) {
            console.warn("Blockchain fetch attempt failed, using saved contracts", error);
          }
          return;
        }
        
        // If no saved contracts, attempt blockchain fetch or use mock data as fallback
        try {
          await fetchContractsFromBlockchain(factoryContractInstance);
        } catch (error) {
          console.warn("Blockchain fetch failed, falling back to mock data", error);
          console.log(`Reason for blockchain fetch failure: ${error.message}`);
          generateMockContracts();
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching contracts:", err);
        setError(`Failed to load your contracts: ${err.message}`);
        setLoading(false);
        
        // As a last resort, generate mock data even on error
        generateMockContracts();
      }
    };
    
    // Function to fetch contracts from blockchain
    const fetchContractsFromBlockchain = async (contractInstance) => {
      // Since the Factory doesn't have direct methods to get seller contracts,
      // we'll implement a custom approach
      
      // In a production environment with a more complete contract:
      // 1. The Factory contract would have methods like getSellerContracts(address)
      // 2. We would simply call that method to get all contract addresses
      
      // For this implementation, we'll:
      // 1. Query past events for contract creation where the seller is our account
      // 2. For each contract address, create a contract instance and fetch details
      
      console.log("Querying blockchain for contracts using Factory:", contractInstance.address);
      
      try {
        // Use our helper functions to get contracts based on role
        const contractAddresses = role === 'seller' 
          ? await getSellerContracts(contractInstance, account, signer)
          : await getBuyerContracts(contractInstance, account, signer);
        
        if (!contractAddresses || contractAddresses.length === 0) {
          throw new Error(`No contracts found for ${role} ${account}`);
        }
        
        // Process each contract address
        const fetchedContracts = await Promise.all(
          contractAddresses.map(async (address, index) => {
            // Create escrow contract instance
            const escrowContract = createContractFromConfig(
              'CONFIDENTIAL_ESCROW', 
              chainId, 
              signer, 
              address
            );
            
            // Get basic contract details
            const seller = await escrowContract.seller();
            const buyer = await escrowContract.buyer();
            const totalAmount = await escrowContract.amount();
            const statusCode = await escrowContract.getStatus();
            
            // Map contract status to our frontend status
            const statusMap = {
              0: 'pending',
              1: 'active',
              2: 'completed',
              3: 'disputed',
              4: 'refunded'
            };
            
            const status = statusMap[statusCode] || 'unknown';
            
            // In the real implementation, we would also fetch conditions
            // For now we'll use placeholders
            const mockConditions = [
              { title: "Condition 1", description: "First deliverable", completed: true },
              { title: "Condition 2", description: "Second deliverable", completed: status === 'completed' }
            ];
            
            return {
              id: index + 1,
              contractAddress: address,
              sellerAddress: seller,
              buyerAddress: buyer,
              price: ethers.formatEther(totalAmount),
              totalAdvancePayment: ethers.formatEther(totalAmount.div(4)), // Example: 25% advance
              paymentToken: "Native Token",
              deliveryDays: 14,
              timestamp: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
              status,
              conditions: mockConditions
            };
          })
        );
        
        setContracts(fetchedContracts);
        
        // Save to localStorage
        const storageKey = role === 'seller' ? `seller-contracts-${account}` : `buyer-contracts-${account}`;
        localStorage.setItem(storageKey, JSON.stringify(fetchedContracts));
      } catch (error) {
        console.error("Error fetching blockchain contracts:", error);
        throw error;
      }
    };
    
    // Generate mock contracts for development
    const generateMockContracts = () => {
      // These mock contracts are role-specific (seller vs buyer)
      const mockContracts = role === 'seller' ? [
        {
          id: 1,
          buyerAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          sellerAddress: account,
          price: "0.5",
          totalAdvancePayment: "0.1",
          paymentToken: "Native Token",
          deliveryDays: 14,
          contractAddress: "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          status: "active",
          conditions: [
            { title: "Homepage Design", description: "Create wireframes for homepage", completed: true },
            { title: "About Us Page", description: "Design and implement About Us page", completed: false },
            { title: "Contact Form", description: "Create a functional contact form", completed: false }
          ]
        },
        {
          id: 2,
          buyerAddress: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
          sellerAddress: account,
          price: "1.2",
          totalAdvancePayment: "0.4",
          paymentToken: "USDC",
          deliveryDays: 5,
          contractAddress: "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          status: "completed",
          conditions: [
            { title: "Code Audit", description: "Review smart contract code", completed: true },
            { title: "Security Analysis", description: "Perform security analysis", completed: true },
            { title: "Final Report", description: "Deliver comprehensive report", completed: true }
          ]
        },
        {
          id: 3,
          buyerAddress: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
          sellerAddress: account,
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
            { title: "Final Deliverables", description: "Deliver high-resolution artwork", completed: false }
          ]
        }
      ] : [
        // Buyer mock contracts
        {
          id: 1,
          sellerAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          buyerAddress: account,
          price: "0.5",
          totalAdvancePayment: "0.1",
          paymentToken: "Native Token",
          deliveryDays: 14,
          contractAddress: "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
          status: "active",
          conditions: [
            { title: "Homepage Design", description: "Create wireframes for homepage", completed: true },
            { title: "About Us Page", description: "Design and implement About Us page", completed: false },
            { title: "Contact Form", description: "Create a functional contact form", completed: false }
          ]
        },
        {
          id: 2,
          sellerAddress: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
          buyerAddress: account,
          price: "1.2",
          totalAdvancePayment: "0.4",
          paymentToken: "USDC",
          deliveryDays: 5,
          contractAddress: "0x" + Math.floor(Math.random() * 10**40).toString(16).padStart(40, '0'),
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
          status: "completed",
          conditions: [
            { title: "Code Audit", description: "Review smart contract code", completed: true },
            { title: "Security Analysis", description: "Perform security analysis", completed: true },
            { title: "Final Report", description: "Deliver comprehensive report", completed: true }
          ]
        }
      ];
      
      setContracts(mockContracts);
      
      // Save to localStorage for persistence
      const storageKey = role === 'seller' ? `seller-contracts-${account}` : `buyer-contracts-${account}`;
      localStorage.setItem(storageKey, JSON.stringify(mockContracts));
    };
    
    fetchContracts();
  }, [isConnected, account, chainId, userContracts, role, signer]);

  // Function to suppress linter warnings for unused variables
  // in commented-out code blocks
  const suppressUnusedWarning = () => {
    // eslint-disable-next-line no-unused-vars
    const handleNewContract = async (seller, buyer, contractAddress, event) => {
      // Implementation when needed
    };
  };
  suppressUnusedWarning();

  // Set up WebSocket listener for new contracts
  useEffect(() => {
    if (!isConnected || !account || !chainId || !signer || !factoryContract) return;
    
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
            'CONFIDENTIAL_ESCROW', 
            chainId, 
            signer, 
            contractAddress
          );
          
          // Get contract details
          const { getContractDetails } = await import('../utils/escrowHelpers');
          const contractDetails = await getContractDetails(escrowContract);
          
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
              ...contractDetails
            };
            
            // Save updated list to localStorage
            const storageKey = role === 'seller' ? 
              `seller-contracts-${account}` : 
              `buyer-contracts-${account}`;
            
            const updatedContracts = [...prevContracts, newContract];
            localStorage.setItem(storageKey, JSON.stringify(updatedContracts));
            
            return updatedContracts;
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
  }, [isConnected, account, chainId, signer, factoryContract, role]);

  // Filter contracts based on selected filter
  const filteredContracts = contracts.filter(contract => {
    if (selectedFilter === 'all') return true;
    return contract.status === selectedFilter;
  });
  
  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    
    // Also call the external handler if provided
    if (onContractSelected) {
      onContractSelected(contract);
    }
  };
  
  const handleBackFromInteract = () => {
    setSelectedContract(null);
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
    return `${address.substring(0, 6)}...${address.substring(38)}`;
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
  
  return (
    <div className="my-contracts">
      {selectedContract ? (
        role === 'seller' ? (
          <SellerInteractContract 
            contract={selectedContract} 
            onBack={handleBackFromInteract}
          />
        ) : (
          <InteractContract 
            contract={selectedContract} 
            onBack={handleBackFromInteract}
          />
        )
      ) : (
        <>
          <div className="section-header">
            <button onClick={onBack} className="back-button">
              &larr; Back
            </button>
            <h2>My {role === 'seller' ? 'Seller' : 'Buyer'} Contracts</h2>
            <p className="section-description">
              {role === 'seller' 
                ? "Manage contracts where you are providing services as a seller"
                : "Manage contracts where you are receiving services as a buyer"
              }
            </p>
          </div>
          
          {!isConnected ? (
            <div className="connect-prompt">
              <p>Please connect your wallet to view your contracts.</p>
            </div>
          ) : loading ? (
            <div className="loading-spinner">Loading contracts...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="contract-summary">
                <div className={`summary-item ${contracts.length > 0 ? 'active' : ''}`}>
                  <div className="summary-label">Total Contracts</div>
                  <div className="summary-value">{contractSummary.total}</div>
                </div>
                <div className={`summary-item ${contractSummary.active > 0 ? 'active' : ''}`}>
                  <div className="summary-label">Active Contracts</div>
                  <div className="summary-value">{contractSummary.active}</div>
                </div>
                <div className={`summary-item ${contractSummary.completed > 0 ? 'completed' : ''}`}>
                  <div className="summary-label">Completed Contracts</div>
                  <div className="summary-value">{contractSummary.completed}</div>
                </div>
                <div className={`summary-item ${contractSummary.disputed > 0 ? 'disputed' : ''}`}>
                  <div className="summary-label">Disputed Contracts</div>
                  <div className="summary-value">{contractSummary.disputed}</div>
                </div>
                <div className={`summary-item ${contractSummary.pending > 0 ? 'pending' : ''}`}>
                  <div className="summary-label">Pending Contracts</div>
                  <div className="summary-value">{contractSummary.pending}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Total Value</div>
                  <div className="summary-value">
                    {parseFloat(ethers.formatEther(contractSummary.totalValue.toString())).toFixed(4)} ETH
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Average Value</div>
                  <div className="summary-value">
                    {parseFloat(ethers.formatEther(contractSummary.averageValue.toString())).toFixed(4)} ETH
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Largest Contract</div>
                  <div className="summary-value">
                    {parseFloat(ethers.formatEther(contractSummary.largestContract.toString())).toFixed(4)} ETH
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Completion Rate</div>
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
                            {contract.price} {contract.paymentToken}
                            {contract.totalAdvancePayment && parseFloat(contract.totalAdvancePayment) > 0 && (
                              <span className="advance-payment">
                                (Advance: {contract.totalAdvancePayment})
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="detail-row">
                          <div className="detail-label">Created:</div>
                          <div className="detail-value">{formatDate(contract.timestamp)}</div>
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
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyContracts;
