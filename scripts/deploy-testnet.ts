import hre from "hardhat";
import { 
    encodeHook, 
    encodeEIP8121HookForContenthash,
    type EIP8121Target 
} from "../src/index.js";
import { ethers, namehash } from "ethers";
import DataResolverModule from "../ignition/modules/DataResolver.js";
import ZeroParameterHookTargetModule from "../ignition/modules/ZeroParameterHookTarget.js";

/**
 * Deploy resolvers to testnet and set up ENS contenthash hooks.
 */

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const BASE_NAME = "weaken-home-truth-plan-9.eth";

async function getEnsResolver(ensName: string, signer: ethers.Signer) {
    const registryAbi = ["function resolver(bytes32 node) view returns (address)"];
    const resolverAbi = [
        "function setContenthash(bytes32 node, bytes calldata hash) external",
        "function contenthash(bytes32 node) view returns (bytes memory)"
    ];
    
    const registry = new ethers.Contract(ENS_REGISTRY, registryAbi, signer);
    const node = namehash(ensName);
    const resolverAddress = await registry.resolver(node);
    
    return new ethers.Contract(resolverAddress, resolverAbi, signer);
}

async function main() {
    console.log("Deploying resolver contracts to testnet...\n");
    
    const connection = await hre.network.connect();
    const hreEthers = (connection as any).ethers;
    
    const network = await hreEthers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const [deployer] = await hreEthers.getSigners();
    
    console.log("Network Info:");
    console.log("  Network:", network.name);
    console.log("  Chain ID:", chainId);
    console.log("  Deployer:", deployer.address);
    console.log("  Balance:", hreEthers.formatEther(await hreEthers.provider.getBalance(deployer.address)), "ETH");
    console.log();
    
    // Deploy contracts
    console.log("Deploying DataResolver...");
    const { dataResolver } = await (connection as any).ignition.deploy(DataResolverModule);
    console.log("Deploying ZeroParameterHookTarget...");
    const { zeroParameterHookTarget } = await (connection as any).ignition.deploy(ZeroParameterHookTargetModule);
    
    const dataResolverAddress = await dataResolver.getAddress();
    const zeroParameterHookTargetAddress = await zeroParameterHookTarget.getAddress();
    
    console.log("\nDeployment successful!");
    console.log("Contract Addresses:");
    console.log("  DataResolver:", dataResolverAddress);
    console.log("  ZeroParameterHookTarget:", zeroParameterHookTargetAddress);
    console.log();
    
    // Setup test data
    console.log("Setting up test data...");
    const testData = hreEthers.toUtf8Bytes("Hello from EIP-8121 on testnet!");
    
    const singleParamName = "singleparam-" + BASE_NAME;
    const singleParamNode = namehash(singleParamName);
    const tx1 = await dataResolver.setData(singleParamNode, testData);
    await tx1.wait();
    console.log("  DataResolver data set for", singleParamName);
    
    const tx2 = await zeroParameterHookTarget.setData(testData);
    await tx2.wait();
    console.log("  ZeroParameterHookTarget global data set");
    console.log();
    
    // Generate hooks
    console.log("Generating hooks...\n");
    
    // Single-parameter hook
    const target1: EIP8121Target = { chainId, address: dataResolverAddress };
    const hook1Data = await encodeHook("data(bytes32)", `data(${singleParamNode})`, "(bytes)", target1);
    const contenthash1 = encodeEIP8121HookForContenthash(hook1Data);
    
    console.log("=== DataResolver (1 param) ===");
    console.log("  Name:", singleParamName);
    console.log("  Function: data(bytes32)");
    console.log("  Contenthash:", hreEthers.hexlify(contenthash1));
    console.log();
    
    // Zero-parameter hook
    const zeroParamName = "zeroparam-" + BASE_NAME;
    const target2: EIP8121Target = { chainId, address: zeroParameterHookTargetAddress };
    const hook2Data = await encodeHook("getData()", "getData()", "(bytes)", target2);
    const contenthash2 = encodeEIP8121HookForContenthash(hook2Data);
    
    console.log("=== ZeroParameterHookTarget (0 params) ===");
    console.log("  Name:", zeroParamName);
    console.log("  Function: getData()");
    console.log("  Contenthash:", hreEthers.hexlify(contenthash2));
    console.log();
    
    // Set contenthash on ENS
    console.log("Setting ENS contenthash...");
    
    const resolver1 = await getEnsResolver(singleParamName, deployer);
    await resolver1.setContenthash(namehash(singleParamName), hreEthers.hexlify(contenthash1));
    console.log("  Set for", singleParamName);
    
    const resolver2 = await getEnsResolver(zeroParamName, deployer);
    await resolver2.setContenthash(namehash(zeroParamName), hreEthers.hexlify(contenthash2));
    console.log("  Set for", zeroParamName);
    
    console.log("\nDeployment complete!");
    console.log("Run test-deployed.ts to verify hooks work correctly.");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
