import { ethers } from "ethers";
import { formatContractStatus, formatAddress } from "./contractHelpers";

/**
 * Event when a new escrow contract is created
 * @typedef {Object} ContractCreatedEvent
 * @property {string} seller - Seller address
 * @property {string} buyer - Buyer address
 * @property {string} contractAddress - Escrow contract address
 * @property {number} blockNumber - Block number of event
 * @property {string} transactionHash - Transaction hash
 * @property {number} timestamp - Timestamp of creation
 */

/**
 * Get all contracts where the user is a seller by calling the factory contract directly
 * @param {ethers.Contract} factoryContract - The factory contract instance
 * @param {string} sellerAddress - The seller's address
 * @param {ethers.Signer} signer - The signer to use for contract interactions
 * @returns {Promise<Array>} Array of contracts where user is seller
 */
export const getSellerContracts = async (
    factoryContract,
    sellerAddress,
    signer
) => {
    try {
        if (!factoryContract) {
            throw new Error("Missing factory contract instance");
        }

        if (!sellerAddress) {
            throw new Error("Missing seller address");
        }

        if (!signer) {
            throw new Error("Missing signer for contract interactions");
        }

        console.log(
            `Attempting to get seller contracts for address: ${sellerAddress}`
        );

        try {
            // Call the factory contract's getEscrowAddressesOfSeller function
            // Add a small delay before calling the contract to ensure the provider has initialized
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Log the contract details for debugging
            console.log(
                "Factory contract address:",
                factoryContract?.address || "Contract not properly initialized"
            );

            // Make sure the contract is properly initialized before proceeding
            if (!factoryContract || !factoryContract.address) {
                throw new Error("Factory contract is not properly initialized");
            }

            const contractAddresses =
                await factoryContract.getEscrowAddressesOfSeller(sellerAddress);
            console.log(
                `Found ${contractAddresses.length} seller contract addresses`
            );
            return contractAddresses;
        } catch (contractError) {
            console.error("Contract call failed:", contractError);
            console.error("Error details:", contractError);

            // Try an alternative approach - directly calling the method via a raw eth_call
            try {
                console.log(
                    "Attempting raw call to getEscrowAddressesOfSeller"
                );
                const provider = signer.provider;
                const fragment = factoryContract.interface.getFunction(
                    "getEscrowAddressesOfSeller"
                );
                const data = factoryContract.interface.encodeFunctionData(
                    fragment,
                    [sellerAddress]
                );

                const result = await provider.call({
                    to: factoryContract.address,
                    data,
                });

                const decoded = factoryContract.interface.decodeFunctionResult(
                    fragment,
                    result
                );
                console.log("Success with raw call:", decoded);
                return decoded[0]; // First return value is the address array
            } catch (rawError) {
                console.error("Raw call also failed:", rawError);
                throw new Error(
                    `Contract interaction failed: ${contractError.message}`
                );
            }
        }
    } catch (error) {
        console.error("Error getting seller contracts:", error);
        throw error;
    }
};

/**
 * Get all contracts where the user is a buyer by calling the factory contract directly
 * @param {ethers.Contract} factoryContract - The factory contract instance
 * @param {string} buyerAddress - The buyer's address
 * @param {ethers.Signer} signer - The signer to use for contract interactions
 * @returns {Promise<Array>} Array of contracts where user is buyer
 */
export const getBuyerContracts = async (
    factoryContract,
    buyerAddress,
    signer
) => {
    try {
        if (!factoryContract) {
            throw new Error("Missing factory contract instance");
        }

        if (!buyerAddress) {
            throw new Error("Missing buyer address");
        }

        if (!signer) {
            throw new Error("Missing signer for contract interactions");
        }

        console.log(
            `Attempting to get buyer contracts for address: ${buyerAddress}`
        );

        // Log the contract details for debugging
        console.log(
            "Factory contract address:",
            factoryContract?.address || "Contract not properly initialized"
        );

        // Make sure the contract is properly initialized before proceeding
        if (!factoryContract || !factoryContract.address) {
            throw new Error("Factory contract is not properly initialized");
        }

        try {
            // Add a small delay before calling the contract to ensure the provider has initialized
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Call the factory contract's getEscrowAddressOfBuyer function - note the "Of" instead of "es"
            // Try using the regular method call instead of the lowercase version that ethers sometimes prefers
            const contractAddresses =
                await factoryContract.getEscrowAddressOfBuyer(buyerAddress);

            console.log(
                `Found ${contractAddresses.length} buyer contract addresses`
            );
            return contractAddresses;
        } catch (contractError) {
            console.error("Contract call failed:", contractError);
            // Include the error message for better debugging
            console.error("Error details:", contractError);

            // Try an alternative approach - directly calling the method via a raw eth_call
            try {
                console.log("Attempting raw call to getEscrowAddressOfBuyer");
                const provider = signer.provider;
                const fragment = factoryContract.interface.getFunction(
                    "getEscrowAddressOfBuyer"
                );
                const data = factoryContract.interface.encodeFunctionData(
                    fragment,
                    [buyerAddress]
                );

                const result = await provider.call({
                    to: factoryContract.address,
                    data,
                });

                const decoded = factoryContract.interface.decodeFunctionResult(
                    fragment,
                    result
                );
                console.log("Success with raw call:", decoded);
                return decoded[0]; // First return value is the address array
            } catch (rawError) {
                console.error("Raw call also failed:", rawError);
                throw new Error(
                    `All contract interaction attempts failed: ${contractError.message}`
                );
            }
        }
    } catch (error) {
        console.error("Error getting buyer contracts:", error);
        throw error;
    }
};

/**
 * Get all escrow contracts in the system
 * @param {ethers.Contract} factoryContract - The factory contract instance
 * @param {ethers.Signer} signer - The signer to use for contract interactions
 * @returns {Promise<Array>} Array of all contract addresses
 */
export const getAllContracts = async (factoryContract, signer) => {
    try {
        if (!factoryContract) {
            throw new Error("Missing factory contract instance");
        }

        if (!signer) {
            throw new Error("Missing signer for contract interactions");
        }

        console.log("Attempting to get all contract addresses");

        try {
            // Call the factory contract's getEscrowAddresses function
            // Add a small delay before calling the contract
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Log the contract details for debugging
            console.log(
                "Factory contract address:",
                factoryContract?.address || "Contract not properly initialized"
            );

            // Make sure the contract is properly initialized before proceeding
            if (!factoryContract || !factoryContract.address) {
                throw new Error("Factory contract is not properly initialized");
            }

            const contractAddresses =
                await factoryContract.getEscrowAddresses();
            console.log(
                `Found ${contractAddresses.length} total contract addresses`
            );
            return contractAddresses;
        } catch (contractError) {
            console.error("Contract call failed:", contractError);
            console.error("Error details:", contractError);

            // Try an alternative approach - directly calling the method via a raw eth_call
            try {
                console.log("Attempting raw call to getEscrowAddresses");
                const provider = signer.provider;
                const fragment =
                    factoryContract.interface.getFunction("getEscrowAddresses");
                const data = factoryContract.interface.encodeFunctionData(
                    fragment,
                    []
                );

                const result = await provider.call({
                    to: factoryContract.address,
                    data,
                });

                const decoded = factoryContract.interface.decodeFunctionResult(
                    fragment,
                    result
                );
                console.log("Success with raw call:", decoded);
                return decoded[0]; // First return value is the address array
            } catch (rawError) {
                console.error("Raw call also failed:", rawError);
                throw new Error(
                    `Contract interaction failed: ${contractError.message}`
                );
            }
        }
    } catch (error) {
        console.error("Error getting all contracts:", error);
        throw error;
    }
};

/**
 * Gets enhanced contract details from an Escrow contract address
 * @param {string} contractAddress - The address of the escrow contract
 * @param {number} chainId - The current chain ID
 * @param {ethers.Signer} signer - The signer to use for contract interactions
 * @returns {Promise<Object>} Enhanced contract details
 */
export const getEscrowContractDetails = async (
    contractAddress,
    chainId,
    signer
) => {
    try {
        if (!contractAddress) {
            throw new Error("Missing contract address");
        }

        if (!chainId) {
            throw new Error("Missing chain ID");
        }

        if (!signer) {
            throw new Error("Missing signer for contract interactions");
        }

        console.log(`Fetching contract details for: ${contractAddress}`);

        // Create contract instance from address
        const { createContractFromConfig } = await import("./contractHelpers");
        const escrowContract = createContractFromConfig(
            "CONFIDENTIAL_ESCROW",
            chainId,
            signer,
            contractAddress
        );

        if (!escrowContract) {
            throw new Error(
                `Failed to create contract instance for: ${contractAddress}`
            );
        }

        return await getContractDetails(escrowContract);
    } catch (error) {
        console.error(
            `Error fetching contract details for ${contractAddress}:`,
            error
        );
        throw error;
    }
};
/**
 * Listens for contract creation events from the factory
 * @param {ethers.Contract} factoryContract - The factory contract instance
 * @param {Function} callback - Callback function to handle new contract events
 * @param {Object} options - Options for the event listener
 * @param {number|string} options.fromBlock - Block to start listening from (default: 'latest')
 * @param {boolean} options.includePast - Whether to include past events (default: false)
 * @returns {ethers.Contract} The contract with listeners attached
 */
export const listenForNewContracts = (
    factoryContract,
    callback,
    options = {}
) => {
    if (!factoryContract) {
        console.error("Missing factory contract instance");
        return null;
    }

    if (typeof callback !== "function") {
        console.error("Callback must be a function");
        return null;
    }

    const { fromBlock = "latest" } = options;
    // Note: includePast option will be used in the future implementation

    console.log(
        `Setting up contract creation listener from block ${fromBlock}`
    );

    try {
        // Future implementation when Factory contract emits events
        /*
    // Listen for future events
    factoryContract.on('ContractCreated', (seller, buyer, contractAddress, event) => {
      console.log(`New contract created: ${contractAddress}`);
      const contractDetails = {
        seller,
        buyer,
        contractAddress,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Date.now() // We'd get this from the block timestamp in a real implementation
      };
      
      callback(contractDetails);
    });
    
    // Query past events if requested
    if (options.includePast) {
      console.log('Querying past contract creation events...');
      
      factoryContract.queryFilter(
        factoryContract.filters.ContractCreated(),
        fromBlock,
        'latest'
      ).then(events => {
        console.log(`Found ${events.length} past contract creation events`);
        
        events.forEach(event => {
          const { seller, buyer, contractAddress } = event.args;
          const contractDetails = {
            seller,
            buyer,
            contractAddress,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now(), // We'd get this from the block timestamp in a real implementation
            isPastEvent: true
          };
          
          callback(contractDetails);
        });
      }).catch(error => {
        console.error('Error querying past events:', error);
      });
    }
    */

        console.log(
            "Event listeners will be implemented once Factory contract supports events"
        );
        console.log(
            "Recommendation: Factory contract should emit a ContractCreated event when creating escrow contracts"
        );
    } catch (error) {
        console.error("Error setting up contract creation listener:", error);
    }

    return factoryContract;
};

/**
 * Gets contract details from an Escrow contract
 * @param {ethers.Contract} escrowContract - The escrow contract instance
 * @returns {Promise<Object>} Contract details
 */
export const getContractDetails = async (escrowContract) => {
    try {
        if (!escrowContract) {
            throw new Error("Missing escrow contract instance");
        }

        console.log(
            `Fetching details for contract at address: ${escrowContract.address}`
        );

        // Get basic contract details using a single call to getContractInfo
        let seller,
            buyer,
            totalAmount,
            statusCode,
            conditions = [];

        try {
            // Use getContractInfo() to get all contract details in one call
            const contractInfo = await escrowContract.getContractInfo();
            buyer = contractInfo[0]; // buyer is at index 0
            seller = contractInfo[1]; // seller is at index 1
            totalAmount = contractInfo[2]; // total amount is at index 2
            statusCode = contractInfo[3]; // status is at index 3

            // Store condition keys from the 5th element of the returned array
            const conditionKeysFromContract = contractInfo[4];

            console.log(`Contract seller: ${seller}, buyer: ${buyer}`);
            console.log(
                `Contract amount: ${ethers.formatEther(
                    totalAmount
                )}, status: ${statusCode}`
            );
            console.log(
                `Found ${conditionKeysFromContract.length} condition keys`
            );

            // Use the condition keys from getContractInfo for fetching conditions
            if (
                conditionKeysFromContract &&
                conditionKeysFromContract.length > 0
            ) {
                try {
                    conditions = await Promise.all(
                        conditionKeysFromContract.map(async (key) => {
                            try {
                                const condition =
                                    await escrowContract.getCondition(key);
                                return {
                                    key,
                                    title: condition.title,
                                    description: condition.description,
                                    completed:
                                        condition.approvedByBuyer &&
                                        condition.approvedBySeller,
                                    advancePayment:
                                        condition.advancePayment > 0,
                                    advanceAmount: ethers.formatEther(
                                        condition.advancePayment
                                    ),
                                };
                            } catch (err) {
                                console.error(
                                    `Error fetching condition ${key}:`,
                                    err
                                );
                                return {
                                    key,
                                    title: "Could not load condition",
                                    description:
                                        "Error fetching condition data",
                                    completed: false,
                                    advancePayment: false,
                                    advanceAmount: "0",
                                };
                            }
                        })
                    );
                } catch (conditionError) {
                    console.error(
                        "Error processing conditions:",
                        conditionError
                    );
                    conditions = [
                        {
                            title: "Contract Deliverable",
                            description: "Main deliverable for this contract",
                            completed: statusMap[statusCode] === "completed",
                            advancePayment: false,
                            advanceAmount: "0",
                        },
                    ];
                }
            }
        } catch (error) {
            console.error("Error fetching contract info:", error);
            seller = ethers.ZeroAddress;
            buyer = ethers.ZeroAddress;
            totalAmount = ethers.parseEther("0");
            statusCode = 0; // Default to pending
        }

        // Map status code to readable status
        const statusMap = {
            0: "pending", // IN_PROGRESS (enum index 0)
            1: "active", // FUNDS_LOCKED (enum index 1)
            2: "completed", // COMPLETE (enum index 2)
        };

        // Try to get conditions if the contract supports it
        try {
            // This method name might be different depending on your actual contract implementation
            // Adjust as needed based on your ConfidentialEscrow contract
            const conditionKeys = await escrowContract.getConditionKeys();

            conditions = await Promise.all(
                conditionKeys.map(async (key) => {
                    const condition = await escrowContract.getCondition(key);
                    return {
                        title: condition.title,
                        description: condition.description,
                        completed:
                            condition.approvedByBuyer &&
                            condition.approvedBySeller,
                        advancePayment: condition.advancePayment > 0,
                        advanceAmount: ethers.formatEther(
                            condition.advancePayment
                        ),
                    };
                })
            );

            console.log(
                `Fetched ${conditions.length} conditions from contract`
            );
        } catch (error) {
            console.error(
                "Error fetching conditions (may not be supported):",
                error
            );

            // Create a default condition if none could be fetched
            conditions = [
                {
                    title: "Contract Deliverable",
                    description: "Main deliverable for this contract",
                    completed: statusMap[statusCode] === "completed",
                    advancePayment: false,
                    advanceAmount: "0",
                },
            ];
        }

        const contractDetails = {
            sellerAddress: seller,
            buyerAddress: buyer,
            price: ethers.formatEther(totalAmount),
            totalAdvancePayment: calculateTotalAdvance(conditions),
            status: statusMap[statusCode] || "unknown",
            conditions,
            contractAddress: escrowContract.address,
            timestamp: Date.now(), // Real contract would have a creation timestamp
            paymentToken: "Native Token", // This could come from the contract if it supports multiple tokens
            deliveryDays: 14, // This could be calculated from contract deadline if available
        };

        console.log("Contract details successfully retrieved");
        return contractDetails;
    } catch (error) {
        console.error("Error getting contract details:", error);
        throw error;
    }
};

/**
 * Calculate total advance payment from conditions
 * @param {Array} conditions - Array of condition objects
 * @returns {string} Total advance payment as a string
 */
const calculateTotalAdvance = (conditions) => {
    if (!conditions || !conditions.length) return "0";

    const total = conditions.reduce((sum, condition) => {
        if (condition.advancePayment && condition.advanceAmount) {
            return sum + parseFloat(condition.advanceAmount);
        }
        return sum;
    }, 0);

    return total.toString();
};
