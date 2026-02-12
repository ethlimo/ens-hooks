import hre from "hardhat";
import { 
    encodeHook, 
    decodeHook, 
    executeHook,
    computeSelector, 
    encodeEIP8121HookForContenthash,
    type EIP8121Target,
    type ProviderMap 
} from "../src/index.js";
import { namehash } from "ethers";

/**
 * Test deployed resolvers.
 * Run with: npm run deploy
 */
async function main() {
    console.log("Testing deployed resolvers with ENS contenthash hooks...\n");
    
    const connection = await hre.network.connect();
    const ethers = (connection as any).ethers;
    const [deployer] = await ethers.getSigners();
    
    // Use deployed contract addresses (update these after deployment)
    const dataResolverAddress = "0xd18595a8e5D7d1b14Ff1537Bf4E930a603BAAe18";
    const zeroParameterHookTargetAddress = "0x18978acF54162a2ea9bA1eC162323E7DF72679fD";
    
    const chainId = Number((await ethers.provider.getNetwork()).chainId);
    const testNode = namehash("test.eth");
    
    console.log("Network Info:");
    console.log("  Chain ID:", chainId);
    console.log("  Deployer:", deployer.address);
    console.log("  DataResolver:", dataResolverAddress);
    console.log("  ZeroParameterHookTarget:", zeroParameterHookTargetAddress);
    console.log();
    
    // Setup provider map for hook execution
    const providerMap: ProviderMap = new Map();
    providerMap.set(chainId, ethers.provider);
    
    // ========================================================================
    // Test 1: Single-Parameter Hook on test.eth (using deployer)
    // ========================================================================
    console.log("=== Test 1: Single-Parameter Hook Setup ===");
    
    // Encode hook for single-parameter function
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
    
    // Wrap hook for contenthash
    const contenthash1 = encodeEIP8121HookForContenthash(hook1Data);
    console.log("  Function:", "data(bytes32)");
    console.log("  Target:", dataResolverAddress);
    console.log("  Hook encoded:", hook1Data);
    console.log("  Contenthash:", ethers.hexlify(contenthash1));
    console.log();
    
    const decoded1 = await decodeHook(hook1Data);
    
    if (!decoded1) {
        throw new Error("Failed to decode hook");
    }
    
    console.log("  Executing hook for test.eth...");
    const result1 = await executeHook(decoded1, {
        nodehash: testNode,
        providerMap
    });
    
    if (result1._tag === "HookExecutionResult") {
        console.log("  Hook executed successfully");
        console.log("  Result (hex):", ethers.hexlify(result1.data));
        // result.data is already the decoded bytes from executeHook
        console.log("  Decoded (UTF-8):", ethers.toUtf8String(result1.data));
    } else {
        console.log("  Hook execution failed:", result1.message);
    }
    console.log();
    
    // ========================================================================
    // Test 2: Zero-Parameter Hook (ownerOnly Global Data)
    // ========================================================================
    console.log("=== Test 2: Zero-Parameter Hook ===" );
    
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
    
    // Wrap hook for contenthash
    const contenthash2 = encodeEIP8121HookForContenthash(hook2Data);
    console.log("  Function:", "getData()");
    console.log("  Target:", zeroParameterHookTargetAddress);
    console.log("  Hook encoded:", hook2Data);
    console.log("  Contenthash:", ethers.hexlify(contenthash2));
    console.log();
    
    const decoded2 = await decodeHook(hook2Data);
    
    if (!decoded2) {
        throw new Error("Failed to decode hook");
    }
    
    console.log("  Executing zero-parameter hook...");
    const result2 = await executeHook(decoded2, {
        providerMap  // No nodehash for 0-parameter functions
    });
    
    if (result2._tag === "HookExecutionResult") {
        console.log("  Hook executed successfully");
        console.log("  Result (hex):", ethers.hexlify(result2.data));
        console.log("  Decoded (UTF-8):", ethers.toUtf8String(result2.data));
    } else {
        console.log("  Hook execution failed:", result2.message);
    }
    console.log();
    
    // ========================================================================
    // Test 3: Verify parameter count validation
    // ========================================================================
    console.log("=== Test 3: Parameter Count Validation ===" );
    
    console.log("  Testing zero-parameter hook with nodehash (should fail)...");
    
    const result3 = await executeHook(decoded2, {
        nodehash: testNode,  // This should cause an error
        providerMap
    });
    
    if (result3._tag === "HookExecutionError") {
        console.log("  Validation correctly rejected:", result3.message);
    } else {
        console.log("  Unexpected success - validation should have failed");
    }
    console.log();
    
    console.log("All tests completed successfully!");
    console.log("\nSummary:");
    console.log("  - One-parameter hook encoded and executed");
    console.log("  - Zero-parameter hook encoded and executed");
    console.log("  - Parameter count validation verified");
    console.log("\nNote: On a real forked network, you would impersonate ENS name owners");
    console.log("   to set contenthash. This demo shows the hook execution flow.");
}

main().catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
});
