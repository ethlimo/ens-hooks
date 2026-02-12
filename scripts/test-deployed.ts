import hre from "hardhat";
import { 
    decodeHook, 
    executeHook,
    validateHook,
    tryDecodeEIP8121HookFromContenthash,
    type ProviderMap 
} from "../src/index.js";
import { ethers, namehash } from "ethers";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

/**
 * Test deployed hooks by querying ENS contenthash and following hooks.
 */

async function getContenthash(ensName: string, provider: ethers.Provider): Promise<string | null> {
    const registryAbi = ["function resolver(bytes32 node) view returns (address)"];
    const resolverAbi = ["function contenthash(bytes32 node) view returns (bytes memory)"];
    
    const registry = new ethers.Contract(ENS_REGISTRY, registryAbi, provider);
    const node = namehash(ensName);
    
    const resolverAddress = await registry.resolver(node);
    if (resolverAddress === ethers.ZeroAddress) return null;
    
    const resolver = new ethers.Contract(resolverAddress, resolverAbi, provider);
    const contenthash = await resolver.contenthash(node);
    
    return contenthash === "0x" ? null : contenthash;
}

async function main() {
    console.log("Testing deployed hooks via ENS contenthash...\n");
    
    const connection = await hre.network.connect();
    const hreEthers = (connection as any).ethers;
    
    const network = await hreEthers.provider.getNetwork();
    const chainId = Number(network.chainId);
    
    console.log("Network Info:");
    console.log("  Chain ID:", chainId);
    console.log("  Network:", network.name);
    console.log();
    
    const providerMap: ProviderMap = new Map([[chainId, hreEthers.provider]]);
    
    // Test ENS names with hooks
    const testNames = [
        "singleparam-weaken-home-truth-plan-9.eth",
        "multiparam-weaken-home-truth-plan-9.eth"
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const ensName of testNames) {
        console.log(`=== ${ensName} ===`);
        
        try {
            // Query contenthash
            const contenthash = await getContenthash(ensName, hreEthers.provider);
            if (!contenthash) {
                console.log("  No contenthash set");
                continue;
            }
            console.log("  Contenthash:", contenthash.slice(0, 40) + "...");
            
            // Try to decode as EIP-8121 hook
            const hookData = tryDecodeEIP8121HookFromContenthash(contenthash);
            if (!hookData) {
                console.log("  Not an EIP-8121 hook");
                continue;
            }
            console.log("  Detected EIP-8121 hook");
            
            // Decode hook
            const decoded = await decodeHook(hookData);
            if (!decoded) {
                throw new Error("Failed to decode hook");
            }
            console.log("  Function:", decoded.functionSignature);
            console.log("  Target:", decoded.target.address);
            console.log("  Chain:", decoded.target.chainId);
            
            // Validate hook
            const validation = validateHook(decoded);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.error}`);
            }
            console.log("  Validation: OK");
            
            // Determine params from function signature
            const paramMatch = decoded.functionSignature.match(/\(([^)]*)\)/);
            const paramTypes = paramMatch && paramMatch[1] ? paramMatch[1].split(",").filter(Boolean) : [];
            
            // Execute hook based on parameter count
            let result;
            if (paramTypes.length === 0) {
                result = await executeHook(decoded, { providerMap });
            } else if (paramTypes.length === 1) {
                result = await executeHook(decoded, { 
                    params: [namehash(ensName)] as [string], 
                    providerMap 
                });
            } else {
                result = await executeHook(decoded, { 
                    params: [namehash(ensName), "0x0000000000000000000000000000000000000000000000000000000000000000"] as [string, string], 
                    providerMap 
                });
            }
            
            if (result._tag === "HookExecutionResult") {
                console.log("  Execution: OK");
                console.log("  Result:", hreEthers.toUtf8String(result.data));
                passed++;
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            console.log("  Error:", error.message);
            failed++;
        }
        console.log();
    }
    
    console.log("=".repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(60));
}

main().catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
});
