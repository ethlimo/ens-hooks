import hre from "hardhat";
import { 
    encodeHook, 
    decodeHook, 
    executeHook,
    validateHook,
    encodeEIP8121HookForContenthash,
    tryDecodeEIP8121HookFromContenthash,
    type EIP8121Target,
    type ProviderMap 
} from "../src/index.js";
import { namehash, Contract } from "ethers";
import AllParameterPermutationsHookTargetModule from "../ignition/modules/AllParameterPermutationsHookTarget.js";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const NAME_WRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
const TEST_NAME = "vitalik.eth";

/**
 * Test all parameter permutations on local hardhat node (mainnet fork).
 * Tests 0-2 parameter hooks with various fixed-size primitive types.
 */

interface TestCase {
    name: string;
    signature: string;
    call: string;
    setter: string;
    setterArgs: any[];
}

async function main() {
    console.log("Testing all parameter permutations on localhost (mainnet fork)...\n");
    
    const connection = await hre.network.connect() as any;
    const ethers = connection.ethers;
    const [deployer] = await ethers.getSigners();
    
    // Deploy contract
    const { allParameterPermutationsHookTarget } = await connection.ignition.deploy(AllParameterPermutationsHookTargetModule);
    const contractAddress = await allParameterPermutationsHookTarget.getAddress();
    
    const chainId = Number((await ethers.provider.getNetwork()).chainId);
    const providerMap: ProviderMap = new Map([[chainId, ethers.provider]]);
    
    // Get ENS resolver and owner for test.eth
    const testNode = namehash(TEST_NAME);
    const registry = new Contract(ENS_REGISTRY, [
        "function resolver(bytes32 node) view returns (address)",
        "function owner(bytes32 node) view returns (address)"
    ], ethers.provider);
    
    const resolverAddress = await registry.resolver(testNode);
    const registryOwner = await registry.owner(testNode);
    
    // Check if wrapped (registry owner is NameWrapper)
    let ownerAddress: string;
    if (registryOwner.toLowerCase() === NAME_WRAPPER.toLowerCase()) {
        const wrapper = new Contract(NAME_WRAPPER, [
            "function ownerOf(uint256 id) view returns (address)"
        ], ethers.provider);
        ownerAddress = await wrapper.ownerOf(testNode);
    } else {
        ownerAddress = registryOwner;
    }
    
    // Impersonate owner
    const owner = await ethers.getImpersonatedSigner(ownerAddress);
    await deployer.sendTransaction({ to: ownerAddress, value: ethers.parseEther("1") });
    
    const resolver = new Contract(resolverAddress, [
        "function setContenthash(bytes32 node, bytes calldata hash) external",
        "function contenthash(bytes32 node) view returns (bytes memory)"
    ], owner);
    
    console.log("Network Info:");
    console.log("  Chain ID:", chainId);
    console.log("  Contract:", contractAddress);
    console.log("  ENS Name:", TEST_NAME);
    console.log("  Resolver:", resolverAddress);
    console.log("  Owner:", ownerAddress);
    console.log();
    
    const target: EIP8121Target = { chainId, address: contractAddress };
    
    // Test values
    const testBytes32 = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const testBytes32Alt = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    const testAddress = "0x1234567890123456789012345678901234567890";
    const testUint256 = "42";
    const testUint256Alt = "999";
    const testBool = "true";
    
    // All test cases
    const testCases: TestCase[] = [
        // 0 parameters
        {
            name: "0 params",
            signature: "get0()",
            call: "get0()",
            setter: "set0",
            setterArgs: []
        },
        // 1 parameter - bytes32
        {
            name: "1 param (bytes32)",
            signature: "get1Bytes32(bytes32)",
            call: `get1Bytes32(${testBytes32})`,
            setter: "set1Bytes32",
            setterArgs: [testBytes32]
        },
        // 1 parameter - address
        {
            name: "1 param (address)",
            signature: "get1Address(address)",
            call: `get1Address(${testAddress})`,
            setter: "set1Address",
            setterArgs: [testAddress]
        },
        // 1 parameter - uint256
        {
            name: "1 param (uint256)",
            signature: "get1Uint256(uint256)",
            call: `get1Uint256(${testUint256})`,
            setter: "set1Uint256",
            setterArgs: [testUint256]
        },
        // 1 parameter - bool
        {
            name: "1 param (bool)",
            signature: "get1Bool(bool)",
            call: `get1Bool(${testBool})`,
            setter: "set1Bool",
            setterArgs: [true]
        },
        // 2 parameters - bytes32, bytes32
        {
            name: "2 params (bytes32,bytes32)",
            signature: "get2Bytes32Bytes32(bytes32,bytes32)",
            call: `get2Bytes32Bytes32(${testBytes32},${testBytes32Alt})`,
            setter: "set2Bytes32Bytes32",
            setterArgs: [testBytes32, testBytes32Alt]
        },
        // 2 parameters - bytes32, uint256
        {
            name: "2 params (bytes32,uint256)",
            signature: "get2Bytes32Uint256(bytes32,uint256)",
            call: `get2Bytes32Uint256(${testBytes32},${testUint256})`,
            setter: "set2Bytes32Uint256",
            setterArgs: [testBytes32, testUint256]
        },
        // 2 parameters - bytes32, address
        {
            name: "2 params (bytes32,address)",
            signature: "get2Bytes32Address(bytes32,address)",
            call: `get2Bytes32Address(${testBytes32},${testAddress})`,
            setter: "set2Bytes32Address",
            setterArgs: [testBytes32, testAddress]
        },
        // 2 parameters - address, uint256
        {
            name: "2 params (address,uint256)",
            signature: "get2AddressUint256(address,uint256)",
            call: `get2AddressUint256(${testAddress},${testUint256})`,
            setter: "set2AddressUint256",
            setterArgs: [testAddress, testUint256]
        },
        // 2 parameters - uint256, uint256
        {
            name: "2 params (uint256,uint256)",
            signature: "get2Uint256Uint256(uint256,uint256)",
            call: `get2Uint256Uint256(${testUint256},${testUint256Alt})`,
            setter: "set2Uint256Uint256",
            setterArgs: [testUint256, testUint256Alt]
        },
        // 2 parameters - bool, bytes32
        {
            name: "2 params (bool,bytes32)",
            signature: "get2BoolBytes32(bool,bytes32)",
            call: `get2BoolBytes32(${testBool},${testBytes32})`,
            setter: "set2BoolBytes32",
            setterArgs: [true, testBytes32]
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        const testValue = `Test data for ${testCase.name}`;
        const testData = ethers.toUtf8Bytes(testValue);
        
        try {
            // Set test data on contract
            const tx = await allParameterPermutationsHookTarget[testCase.setter](...testCase.setterArgs, testData);
            await tx.wait();
            
            // Encode hook
            const hookData = await encodeHook(testCase.signature, testCase.call, "(bytes)", target);
            
            // Wrap for contenthash and set on ENS resolver
            const contenthash = encodeEIP8121HookForContenthash(hookData);
            const setTx = await resolver.setContenthash(testNode, contenthash);
            await setTx.wait();
            
            // Read contenthash from resolver
            const storedContenthash = await resolver.contenthash(testNode);
            
            // Decode from contenthash
            const unwrapped = tryDecodeEIP8121HookFromContenthash(storedContenthash);
            if (!unwrapped) throw new Error("Failed to decode from contenthash");
            
            // Decode hook
            const decoded = await decodeHook(unwrapped);
            if (!decoded) throw new Error("Failed to decode hook");
            
            // Validate hook
            const validation = validateHook(decoded);
            if (!validation.isValid) throw new Error(`Validation failed: ${validation.error}`);
            
            // Execute hook - parameters come from functionCall
            const result = await executeHook(decoded, { providerMap });
            
            if (result._tag !== "HookExecutionResult") {
                throw new Error(`Execution failed: ${result.message}`);
            }
            
            const resultStr = ethers.toUtf8String(result.data);
            if (resultStr !== testValue) {
                throw new Error(`Data mismatch: expected "${testValue}", got "${resultStr}"`);
            }
            
            console.log(`✓ ${testCase.name}`);
            passed++;
        } catch (error: any) {
            console.log(`✗ ${testCase.name}: ${error.message}`);
            failed++;
        }
    }
    
    console.log();
    console.log("=".repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(60));
    
    if (failed > 0) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
});
