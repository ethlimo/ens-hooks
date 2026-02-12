import hre from "hardhat";
import { 
    encodeHook, 
    computeSelector, 
    encodeEIP8121HookForContenthash,
    type EIP8121Target 
} from "../src/index.js";
import { ethers, namehash } from "ethers";
import DataResolverModule from "../ignition/modules/DataResolver.js";
import ZeroParameterHookTargetModule from "../ignition/modules/ZeroParameterHookTarget.js";

/**
 * Deploy resolvers to testnet.
 * Outputs hooks and instructions for ENS contenthash setup.
 */

async function getEnsNameResolver(ensName: string, signer: ethers.Signer) {
    const registryAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"; // ENS Registry
    const registryAbi = [
        "function resolver(bytes32 node) view returns (address)"
    ];
    const resolverAbi = [
        "function setContenthash(bytes32 node, bytes calldata hash) external",
        "function contenthash(bytes32 node) view returns (bytes memory)"
    ];
    
    const registryContract = new ethers.Contract(registryAddress, registryAbi, signer);
    const node = namehash(ensName);
    const resolverAddress = await registryContract.resolver(node);
    const resolverContract = new ethers.Contract(resolverAddress, resolverAbi, signer);
    
    return resolverContract;
}

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
    console.log("Deploying DataResolver...");
    const { dataResolver } = await (connection as any).ignition.deploy(DataResolverModule);
    console.log("Deploying ZeroParameterHookTarget...");
    const { zeroParameterHookTarget } = await (connection as any).ignition.deploy(ZeroParameterHookTargetModule);
    
    const dataResolverAddress = await dataResolver.getAddress();
    const zeroParameterHookTargetAddress = await zeroParameterHookTarget.getAddress();
    
    console.log("Deployment successful!\n");
    console.log("Contract Addresses:");
    console.log("  DataResolver:", dataResolverAddress);
    console.log("  ZeroParameterHookTarget:", zeroParameterHookTargetAddress);
    console.log();
    
    // Setup test data
    console.log("Setting up test data...");
    const testNode = "weaken-home-truth-plan-9.eth";
    const testData = ethers.toUtf8Bytes("Hello from EIP-8121 on testnet!");
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], [testData]);
    
    const tx1ensname = "singleparam-" + testNode;
    const tx1namehash = namehash(tx1ensname);
    const tx1 = await dataResolver.setData(tx1namehash, encodedData);
    await tx1.wait();
    console.log("  DataResolver test data set");
    
    const tx2 = await zeroParameterHookTarget.setData(encodedData);
    await tx2.wait();
    console.log("  ZeroParameterHookTarget test data set");
    console.log();
    
    // ========================================================================
    // Generate hooks and contenthash values
    // ========================================================================
    
    console.log("Generating Hooks and Contenthash Values:\n");
    
    // Single-parameter hook
    console.log("=== DataResolver (One Parameter) ===");
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
    
    // Zero-parameter hook
    console.log("=== ZeroParameterHookTarget (Zero Parameters) ===");
    const target2: EIP8121Target = {
        chainId: chainId,
        address: zeroParameterHookTargetAddress
    };
    
    const hook2Data = await encodeHook(
        computeSelector("getData()"),
        "getData()",
        "(bytes)",
        target2
    );
    
    const contenthash2 = encodeEIP8121HookForContenthash(hook2Data);
    
    console.log("Function Signature:", "getData()");
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

    const resolver1 = await getEnsNameResolver("singleparam-" + testNode, deployer);
    await resolver1.setContenthash(namehash("singleparam-" + testNode), ethers.hexlify(contenthash1));

    const resolver2 = await getEnsNameResolver("multiparam-" + testNode, deployer);
    await resolver2.setContenthash(namehash("multiparam-" + testNode), ethers.hexlify(contenthash2));
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
