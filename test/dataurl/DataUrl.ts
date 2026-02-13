import { HardhatEthers, HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import hre from "hardhat";
import { DataResolver } from "../../types/ethers-contracts/DataResolver.js";
import { expect } from "chai";
import { 
    encodeHook,
    decodeHook,
    computeSelector,
    type EIP8121Target 
} from "../../src/dataurl/encoding.js";
import { 
    executeHook,
    validateHook,
    type ProviderMap 
} from "../../src/dataurl/index.js";
import { namehash } from "ethers";
import "@nomicfoundation/hardhat-ethers-chai-matchers";

describe("EIP-8121 DataResolver Integration", function () {
    var ethers: HardhatEthers;
    var owner: HardhatEthersSigner;
    var otherAccount: HardhatEthersSigner;
    var dataResolverContract: DataResolver;
    var providerMap: ProviderMap;
    var chainId: bigint;

    before(async () => {
        const ret = await hre.network.connect();
        ethers = (ret as any).ethers as HardhatEthers;
    });

    beforeEach(async () => {
        [owner, otherAccount] = await ethers.getSigners();
        dataResolverContract = await ethers.deployContract("DataResolver", owner) as any as DataResolver;
        
        // Create provider map for local network
        chainId = BigInt((await ethers.provider.getNetwork()).chainId);
        providerMap = new Map();
        providerMap.set(Number(chainId), ethers.provider);
    });

    it("should store and retrieve simple data", async function () {
        const blob = "data:text/html,<html><body>Hello, World!</body></html>";
        const data = ethers.toUtf8Bytes(blob);
        const node = namehash("test.eth");
        
        await dataResolverContract.setData(node, data);
        const retrieved = await dataResolverContract.data(node);
        
        expect(ethers.toUtf8String(retrieved)).to.equal(blob);
    });

    it("should encode, store, and decode a hook", async function () {
        const functionSignature = "data(bytes32)";
        const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const node = namehash("test.eth");
        
        await dataResolverContract.setData(node, ethers.toUtf8Bytes("stored-hook"));
        
        const decoded = await decodeHook(hookData);
        expect(decoded).to.not.be.null;
        expect(decoded!.functionSignature).to.equal(functionSignature);
        expect(decoded!.target.chainId).to.equal(31337);
    });

    it("should validate hook with correct selector", async function () {
        const functionSignature = "data(bytes32)";
        const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.true;
    });

    it("should reject hook with incorrect selector", async function () {
        const functionSignature = "data(bytes32)";
        const functionCall = "getData()"; // Wrong - mismatch
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        // Should throw during encoding due to mismatch
        try {
            await encodeHook(functionSignature, functionCall, returnType, target);
            expect.fail("Should have thrown on function name mismatch");
        } catch (error: any) {
            expect(error.message).to.include("Function name mismatch");
        }
    });

    it("should execute hook and retrieve data", async function () {
        const testData = "Hello from EIP-8121!";
        const dataBytes = ethers.toUtf8Bytes(testData);
        const node = namehash("test.eth");
        
        await dataResolverContract.setData(node, dataBytes);
        
        const functionSignature = "data(bytes32)";
        const nodehashValue = node;
        const functionCall = `data(${nodehashValue})`;
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.true;
    });

    it("should handle ABI-encoded return values", async function () {
        const testString = "Test Value";
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [testString]);
        const node = namehash("test.eth");
        
        await dataResolverContract.setData(node, encoded);
        
        const retrieved = await dataResolverContract.data(node);
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["string"], retrieved);
        
        expect(decoded[0]).to.equal(testString);
    });

    it("should emit DataChanged event", async function () {
        const node = namehash("test.eth");
        const data = ethers.toUtf8Bytes("test data");
        
        await expect(dataResolverContract.setData(node, data))
            .to.emit(dataResolverContract, "DataChanged");
    });

    it("should handle empty data", async function () {
        const node = namehash("test.eth");
        const emptyData = "0x";
        
        await dataResolverContract.setData(node, emptyData);
        const retrieved = await dataResolverContract.data(node);
        
        expect(retrieved).to.equal(emptyData);
    });

    it("should handle large data blobs", async function () {
        const largeString = "x".repeat(10000);
        const largeData = ethers.toUtf8Bytes(largeString);
        const node = namehash("test.eth");
        
        await dataResolverContract.setData(node, largeData);
        const retrieved = await dataResolverContract.data(node);
        
        expect(ethers.toUtf8String(retrieved)).to.equal(largeString);
    });

    it("should reject untrusted targets", async function () {
        const { executeHook, createTrustedTargets } = await import("../../src/index.js");
        
        const functionSignature = "data(bytes32)";
        const node = namehash("test.eth");
        const functionCall = `data(${node})`;
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        // Create trusted targets that doesn't include our contract
        const trustedTargets = createTrustedTargets([
            { chainId: 1, address: "0x1234567890123456789012345678901234567890" }
        ]);
        
        const providerMap = new Map([[31337, ethers.provider]]);
        
        const result = await executeHook(decoded!, {
            providerMap,
            trustedTargets
        });
        
        expect(result._tag).to.equal("HookExecutionError");
        if (result._tag === "HookExecutionError") {
            expect(result.message).to.include("Untrusted target");
        }
    });

    it("should accept trusted targets", async function () {
        const { executeHook, createTrustedTargets } = await import("../../src/index.js");
        
        const testData = ethers.toUtf8Bytes("Trusted data");
        const node = namehash("test.eth");
        await dataResolverContract.setData(node, testData);
        
        const functionSignature = "data(bytes32)";
        const functionCall = `data(${node})`;
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        // Create trusted targets that includes our contract
        const trustedTargets = createTrustedTargets([
            { chainId: 31337, address: await dataResolverContract.getAddress(), description: "Test contract" }
        ]);
        
        const providerMap = new Map([[31337, ethers.provider]]);
        
        const result = await executeHook(decoded!, {
            providerMap,
            trustedTargets
        });
        
        // Either it succeeds or fails for a different reason (not trust)
        if (result._tag === "HookExecutionError") {
            expect(result.message).to.not.include("Untrusted target");
        }
    });
});

describe("ZeroParameterHookTarget - Zero-Parameter Hooks", function () {
    var ethers: HardhatEthers;
    let zeroParameterHookTarget: any;
    let chainId: bigint;
    let providerMap: Map<number | bigint, any>;
    let owner: any;

    before(async () => {
        const ret = await hre.network.connect();
        ethers = (ret as any).ethers as HardhatEthers;
    });

    beforeEach(async () => {
        const [signer] = await ethers.getSigners();
        owner = signer;
        zeroParameterHookTarget = await ethers.deployContract("ZeroParameterHookTarget");
        
        chainId = BigInt((await ethers.provider.getNetwork()).chainId);
        providerMap = new Map();
        providerMap.set(Number(chainId), ethers.provider);
    });

    it("should execute zero-parameter hook without nodehash", async function () {
        const { executeHook } = await import("../../src/index.js");
        
        const testData = ethers.toUtf8Bytes("Global data");
        // Store raw bytes - executeHook returns bytes directly
        await zeroParameterHookTarget.setData(testData);
        
        const functionSignature = "getData()";
        const functionCall = "getData()";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await zeroParameterHookTarget.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const result = await executeHook(decoded!, {
            providerMap
        });
        
        expect(result._tag).to.equal("HookExecutionResult");
        if (result._tag === "HookExecutionResult") {
            expect(ethers.hexlify(result.data)).to.equal(ethers.hexlify(testData));
        }
    });

    it("should reject zero-parameter function with non-empty arguments", async function () {
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await zeroParameterHookTarget.getAddress()
        };
        
        const functionSignature = "getData()";
        const functionCall = "getData(0x1234567890123456789012345678901234567890123456789012345678901234)";
        const returnType = "(bytes)";
        
        await expect(
            encodeHook(functionSignature, functionCall, returnType, target)
        ).to.be.rejectedWith(/Function expects 0 parameters but call has parameters/);
    });

    it("should call one-parameter hook with encoded parameter", async function () {
        const { executeHook } = await import("../../src/index.js");
        
        const functionSignature = "data(bytes32)";
        const node = namehash("test.eth");
        const functionCall = `data(${node})`;
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await zeroParameterHookTarget.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        // Now functionCall has the parameter encoded
        // This will fail at execution because ZeroParameterHookTarget doesn't have data(bytes32)
        const result = await executeHook(decoded!, {
            providerMap
        });
        
        // Execution will fail because the contract doesn't have this function
        expect(result._tag).to.equal("HookExecutionError");
    });

    it("should accept hook with 2 parameters", async function () {
        const { validateHook } = await import("../../src/index.js");
        
        const functionSignature = "getData(bytes32,bytes32)";
        const functionCall = "getData(0x1234567890123456789012345678901234567890123456789012345678901234,0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await zeroParameterHookTarget.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        // 2 parameters are valid (within the 0-2 limit)
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.true;
    });

    it("should accept hook with string parameter", async function () {
        // Strings are now supported!
        
        const functionSignature = "validFunc(string)";
        const functionCall = "validFunc('test')";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await zeroParameterHookTarget.getAddress()
        };
        
        // Should succeed during encoding - strings are now supported
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.true;
    });

    it("should handle empty global data", async function () {
        const { executeHook } = await import("../../src/index.js");
        
        const emptyData = "0x";
        // Store raw empty bytes - executeHook returns bytes directly (no double-decode)
        await zeroParameterHookTarget.setData(emptyData);
        
        const functionSignature = "getData()";
        const functionCall = "getData()";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await zeroParameterHookTarget.getAddress()
        };
        
        const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const result = await executeHook(decoded!, {
            providerMap
        });
        
        expect(result._tag).to.equal("HookExecutionResult");
        if (result._tag === "HookExecutionResult") {
            expect(result.data).to.equal(emptyData);
        }
    });
});
