import hre from "hardhat";
import { namehash } from "ethers";
import DataResolverModule from "../ignition/modules/DataResolver.js";
import MultiParamResolverModule from "../ignition/modules/MultiParamResolver.js";

/**
 * Deploy test resolver contracts to localhost hardhat node.
 * Deploys both DataResolver and MultiParamResolver for testing.
 */
async function main() {
    console.log("Deploying test resolvers to localhost...");
    
    const connection = await hre.network.connect() as any;
    const ethers = connection.ethers;
    
    // Deploy contracts using Hardhat Ignition
    const { dataResolver } = await connection.ignition.deploy(DataResolverModule);
    const { multiParamResolver } = await connection.ignition.deploy(MultiParamResolverModule);
    
    const dataResolverAddress = await dataResolver.getAddress();
    const multiParamResolverAddress = await multiParamResolver.getAddress();
    
    console.log("\nDeployment successful!");
    console.log("\nContract Addresses:");
    console.log("  DataResolver:       ", dataResolverAddress);
    console.log("  MultiParamResolver: ", multiParamResolverAddress);
    
    // Get signer for initial setup
    const [signer] = await ethers.getSigners();
    console.log("\nDeployer address:", signer.address);
    
    // Setup test data
    const testNode = namehash("test.eth");
    const testData = ethers.toUtf8Bytes("Hello from EIP-8121!");
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], [testData]);
    
    console.log("\nSetting up test data...");
    const tx1 = await dataResolver.setData(testNode, encodedData);
    await tx1.wait();
    console.log("  DataResolver test data set");
    
    const tx2 = await multiParamResolver.setData(testNode, encodedData);
    await tx2.wait();
    console.log("  MultiParamResolver test data set");
    
    console.log("\nSetup complete! Ready for testing.");
    console.log("\nExample usage:");
    console.log(`  Node: ${testNode}`);
    console.log(`  Network: localhost (chain ID: ${(await ethers.provider.getNetwork()).chainId})`);
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
