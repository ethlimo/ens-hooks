import hre from "hardhat";
import { namehash } from "ethers";
import DataResolverModule from "../ignition/modules/DataResolver.js";
import AllParameterPermutationsHookTargetModule from "../ignition/modules/AllParameterPermutationsHookTarget.js";

/**
 * Deploy test contracts to localhost hardhat node.
 */
async function main() {
    console.log("Deploying test contracts to localhost...\n");
    
    const connection = await hre.network.connect() as any;
    const ethers = connection.ethers;
    
    const { dataResolver } = await connection.ignition.deploy(DataResolverModule);
    const { allParameterPermutationsHookTarget } = await connection.ignition.deploy(AllParameterPermutationsHookTargetModule);
    
    const dataResolverAddress = await dataResolver.getAddress();
    const allParamsAddress = await allParameterPermutationsHookTarget.getAddress();
    
    console.log("Deployment successful!\n");
    console.log("Contract Addresses:");
    console.log("  DataResolver:", dataResolverAddress);
    console.log("  AllParameterPermutationsHookTarget:", allParamsAddress);
    
    const [signer] = await ethers.getSigners();
    console.log("\nDeployer:", signer.address);
    
    // Setup test data for DataResolver
    const testNode = namehash("test.eth");
    const testData = ethers.toUtf8Bytes("Hello from DataResolver!");
    
    const tx1 = await dataResolver.setData(testNode, testData);
    await tx1.wait();
    console.log("\nDataResolver test data set for test.eth");
    
    console.log("\nReady for testing with test-localnode.ts");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
