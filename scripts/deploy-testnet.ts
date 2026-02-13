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
const PARENT_NAME = "multiparam-weaken-home-truth-plan-9.eth";
const CONTENTHASH_INTERFACE_ID = "0xbc1c58d1"; // EIP-165 interface ID for contenthash

async function validateParentENS(parentName: string, signer: ethers.Signer): Promise<{ resolverAddress: string; ownerAddress: string }> {
    console.log("Validating parent ENS name:", parentName);
    
    const registryAbi = [
        "function owner(bytes32 node) view returns (address)",
        "function resolver(bytes32 node) view returns (address)"
    ];
    const registry = new ethers.Contract(ENS_REGISTRY, registryAbi, signer);
    const parentNode = namehash(parentName);
    
    // Check 1: Verify ownership
    const ownerAddress = await registry.owner(parentNode);
    const deployerAddress = await signer.getAddress();
    
    if (ownerAddress === ethers.ZeroAddress) {
        throw new Error(`Parent ENS name "${parentName}" does not exist or has no owner`);
    }
    
    if (ownerAddress.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error(
            `Deployer (${deployerAddress}) does not own parent ENS name "${parentName}". ` +
            `Owner is: ${ownerAddress}`
        );
    }
    console.log("  ✓ Ownership verified");
    
    // Check 2: Verify resolver exists
    const resolverAddress = await registry.resolver(parentNode);
    
    if (resolverAddress === ethers.ZeroAddress) {
        throw new Error(`Parent ENS name "${parentName}" has no resolver set`);
    }
    console.log("  ✓ Resolver exists:", resolverAddress);
    
    // Check 3: Verify resolver supports contenthash via EIP-165
    const eip165Abi = ["function supportsInterface(bytes4 interfaceId) view returns (bool)"];
    const resolver = new ethers.Contract(resolverAddress, eip165Abi, signer);
    
    const supportsContenthash = await resolver.supportsInterface(CONTENTHASH_INTERFACE_ID);
    
    if (!supportsContenthash) {
        throw new Error(
            `Resolver at ${resolverAddress} does not support contenthash interface (EIP-165 check failed). ` +
            `Interface ID: ${CONTENTHASH_INTERFACE_ID}`
        );
    }
    console.log("  ✓ Resolver supports contenthash interface (EIP-165)");
    console.log();
    
    return { resolverAddress, ownerAddress };
}

async function setupSubdomain(
    subdomain: string,
    parentName: string,
    resolverAddress: string,
    contenthashBytes: string | Uint8Array,
    signer: ethers.Signer
): Promise<string> {
    const registryAbi = [
        "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl)"
    ];
    const resolverAbi = [
        "function setContenthash(bytes32 node, bytes calldata hash) external"
    ];
    
    const registry = new ethers.Contract(ENS_REGISTRY, registryAbi, signer);
    const resolver = new ethers.Contract(resolverAddress, resolverAbi, signer);
    
    const parentNode = namehash(parentName);
    const labelHash = ethers.keccak256(ethers.toUtf8Bytes(subdomain));
    const fullSubdomainName = `${subdomain}.${parentName}`;
    const subdomainNode = namehash(fullSubdomainName);
    const ownerAddress = await signer.getAddress();
    
    // Create subdomain with resolver
    console.log(`Creating subdomain: ${fullSubdomainName}`);
    const tx1 = await registry.setSubnodeRecord(
        parentNode,
        labelHash,
        ownerAddress,
        resolverAddress,
        0 // TTL
    );
    await tx1.wait();
    console.log("  ✓ Subdomain created");
    
    // Set contenthash on subdomain
    const tx2 = await resolver.setContenthash(subdomainNode, ethers.hexlify(contenthashBytes));
    await tx2.wait();
    console.log("  ✓ Contenthash set");
    console.log();
    
    return fullSubdomainName;
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
    
    // Validate parent ENS name BEFORE deploying contracts
    const { resolverAddress } = await validateParentENS(PARENT_NAME, deployer);
    
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
    
    // Setup data for singleparam subdomain
    const singleParamSubdomain = "singleparam";
    const singleParamFullName = `${singleParamSubdomain}.${PARENT_NAME}`;
    const singleParamNode = namehash(singleParamFullName);
    const tx1 = await dataResolver.setData(singleParamNode, testData);
    await tx1.wait();
    console.log("  DataResolver data set for", singleParamFullName);
    
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
    console.log("  Subdomain: singleparam");
    console.log("  Full Name:", singleParamFullName);
    console.log("  Function: data(bytes32)");
    console.log("  Contenthash:", hreEthers.hexlify(contenthash1));
    console.log();
    
    // Zero-parameter hook
    const zeroParamSubdomain = "zeroparam";
    const zeroParamFullName = `${zeroParamSubdomain}.${PARENT_NAME}`;
    const target2: EIP8121Target = { chainId, address: zeroParameterHookTargetAddress };
    const hook2Data = await encodeHook("getData()", "getData()", "(bytes)", target2);
    const contenthash2 = encodeEIP8121HookForContenthash(hook2Data);
    
    console.log("=== ZeroParameterHookTarget (0 params) ===");
    console.log("  Subdomain: zeroparam");
    console.log("  Full Name:", zeroParamFullName);
    console.log("  Function: getData()");
    console.log("  Contenthash:", hreEthers.hexlify(contenthash2));
    console.log();
    
    // Setup subdomains with contenthash
    console.log("Setting up ENS subdomains...\n");
    
    await setupSubdomain(zeroParamSubdomain, PARENT_NAME, resolverAddress, contenthash2, deployer);
    await setupSubdomain(singleParamSubdomain, PARENT_NAME, resolverAddress, contenthash1, deployer);
    
    console.log("Deployment complete!");
    console.log("\nSubdomains created:");
    console.log("  -", zeroParamFullName);
    console.log("  -", singleParamFullName);
    console.log("\nRun test-deployed.ts to verify hooks work correctly.");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
