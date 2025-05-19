// Test file to verify contract loading works properly
import { getContractInfo } from "../config/contracts";
import { CONTRACT_FACTORY } from "../config/contractTypes";

// Test function that logs contract info for a given chain ID
export const testContractLoading = (chainId) => {
    console.log(`Testing contract loading for chain ID: ${chainId}`);

    try {
        // Get contract info
        const contractInfo = getContractInfo(CONTRACT_FACTORY, chainId);

        console.log("Contract info:", {
            type: CONTRACT_FACTORY,
            hasAddress: !!contractInfo.address,
            address: contractInfo.address,
            hasAbi: !!contractInfo.abi,
            abiLength: contractInfo.abi ? contractInfo.abi.length : 0,
        });

        return {
            success: !!contractInfo.abi && !!contractInfo.address,
            info: contractInfo,
        };
    } catch (error) {
        console.error("Error testing contract loading:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// Run test automatically
if (typeof window !== "undefined") {
    window.testContractLoading = testContractLoading;
    console.log(
        "Contract test function attached to window.testContractLoading"
    );
}
