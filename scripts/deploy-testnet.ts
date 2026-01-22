import hre from "hardhat";
import { 
    encodeHook, 
    computeSelector, 
    encodeEIP8121HookForContenthash,
    type EIP8121Target 
} from "../src/index.js";
import { namehash } from "ethers";
import TestResolversModule from "../ignition/modules/DataResolver.js";

/**
 * Deploy resolver contracts to a testnet and provide instructions for setup.
 * 
 * This script:
 * 1. Deploys DataResolver and MultiParamResolver
 * 2. Sets up initial test data
 * 3. Encodes hooks for both contracts
 * 4. Outputs instructions for setting ENS contenthash
 */
async function main() {
    console.log("Deploying resolver contracts to testnet...\n");
    
    const connection = await hre.network.connect();
    const ethers = (connection as any).ethers;
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const [deployer] = await ethers.getSigners();
    
    console.log("Network Info:");
    console.log("  Network:", network.name);
    console.log("  Chain ID:", chainId);
    console.log("  Deployer:", deployer.address);
    console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log();
    
    // Deploy contracts
    console.log("Deploying contracts...");
    const { dataResolver, multiParamResolver } = await (connection as any).ignition.deploy(TestResolversModule);
    
    const dataResolverAddress = await dataResolver.getAddress();
    const multiParamResolverAddress = await multiParamResolver.getAddress();
    
    console.log("Deployment successful!\n");
    console.log("Contract Addresses:");
    console.log("  DataResolver:", dataResolverAddress);
    console.log("  MultiParamResolver:", multiParamResolverAddress);
    console.log();
    
    // Setup test data
    console.log("Setting up test data...");
    const testNode = namehash("test.eth");
    const testData = ethers.toUtf8Bytes("Hello from EIP-8121 on testnet!");
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], [testData]);
    
    const tx1 = await dataResolver.setData(testNode, encodedData);
    await tx1.wait();
    console.log("  DataResolver test data set");
    
    const tx2 = await multiParamResolver.setData(testNode, encodedData);
    await tx2.wait();
    console.log("  MultiParamResolver test data set");
    console.log();
    
    // ========================================================================
    // Generate hooks and contenthash values
    // ========================================================================
    
    console.log("Generating Hooks and Contenthash Values:\n");
    
    // Single-parameter hook
    console.log("=== DataResolver (Single Parameter) ===");
    const target1: EIP8121Target = {
        chainId: chainId,
        address: dataResolverAddress
    };
    
    const hook1Data = await encodeHook(
        computeSelector("data(bytes32)"),
        "data(bytes32)",
        "(bytes)",
        target1
    );
    
    const contenthash1 = encodeEIP8121HookForContenthash(hook1Data);
    
    console.log("Function Signature:", "data(bytes32)");
    console.log("Hook Data:", hook1Data);
    console.log("Contenthash:", ethers.hexlify(contenthash1));
    console.log();
    
    // Two-parameter hook
    console.log("=== MultiParamResolver (Two Parameters) ===");
    const target2: EIP8121Target = {
        chainId: chainId,
        address: multiParamResolverAddress
    };
    
    const hook2Data = await encodeHook(
        computeSelector("dataWithOptions(bytes32,bytes32)"),
        "dataWithOptions(bytes32,bytes32)",
        "(bytes)",
        target2
    );
    
    const contenthash2 = encodeEIP8121HookForContenthash(hook2Data);
    
    console.log("Function Signature:", "dataWithOptions(bytes32,bytes32)");
    console.log("Hook Data:", hook2Data);
    console.log("Contenthash:", ethers.hexlify(contenthash2));
    console.log();
    
    // ========================================================================
    // Instructions
    // ========================================================================
    
    console.log("=".repeat(80));
    console.log("NEXT STEPS");
    console.log("=".repeat(80));
    console.log();
    
    console.log("1. Store data on the deployed contracts using setData()");
    console.log();
    console.log("2. Set the contenthash on your ENS resolver to one of the values above");
    console.log();
    console.log("For Single-Parameter Hook:");
    console.log(`  ${ethers.hexlify(contenthash1)}`);
    console.log();
    console.log("For Two-Parameter Hook:");
    console.log(`  ${ethers.hexlify(contenthash2)}`);
    console.log();
    console.log("Encoding example:");
    console.log("  const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [yourData])");
    console.log();
    console.log("3. Query and execute the hook to retrieve stored data");
    console.log();
    
    console.log("=".repeat(80));
    console.log("Deployment complete!");
    console.log("=".repeat(80));
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
