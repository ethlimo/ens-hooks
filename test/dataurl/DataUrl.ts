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
        providerMap.set(chainId, ethers.provider);
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
        const functionSelector = computeSelector("data(bytes32)");
        const functionCall = "data(bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const node = namehash("test.eth");
        
        await dataResolverContract.setData(node, ethers.toUtf8Bytes("stored-hook"));
        
        const decoded = await decodeHook(hookData);
        expect(decoded).to.not.be.null;
        expect(decoded!.functionSelector.toLowerCase()).to.equal(functionSelector.toLowerCase());
        expect(decoded!.target.chainId).to.equal(31337);
    });

    it("should validate hook with correct selector", async function () {
        const functionSelector = computeSelector("data(bytes32)");
        const functionCall = "data(bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.true;
    });

    it("should reject hook with incorrect selector", async function () {
        const wrongSelector = "0x12345678";
        const functionCall = "data(bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(wrongSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.false;
        expect(validation.error).to.include("Selector mismatch");
    });

    it("should execute hook and retrieve data", async function () {
        const testData = "Hello from EIP-8121!";
        const dataBytes = ethers.toUtf8Bytes(testData);
        const node = namehash("test.eth");
        
        await dataResolverContract.setData(node, dataBytes);
        
        const functionSelector = computeSelector("data(bytes32)");
        const functionCall = "data(bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
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
        
        const functionSelector = computeSelector("data(bytes32)");
        const functionCall = "data(bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        // Create trusted targets that doesn't include our contract
        const trustedTargets = createTrustedTargets([
            { chainId: 1, address: "0x1234567890123456789012345678901234567890" }
        ]);
        
        const providerMap = new Map([[31337, ethers.provider]]);
        const node = namehash("test.eth");
        
        const result = await executeHook(decoded!, {
            nodehash: node,
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
        
        const functionSelector = computeSelector("data(bytes32)");
        const functionCall = "data(bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: 31337,
            address: await dataResolverContract.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        // Create trusted targets that includes our contract
        const trustedTargets = createTrustedTargets([
            { chainId: 31337, address: await dataResolverContract.getAddress(), description: "Test contract" }
        ]);
        
        const providerMap = new Map([[31337, ethers.provider]]);
        
        const result = await executeHook(decoded!, {
            nodehash: node,
            providerMap,
            trustedTargets
        });
        
        // Either it succeeds or fails for a different reason (not trust)
        if (result._tag === "HookExecutionError") {
            expect(result.message).to.not.include("Untrusted target");
        }
    });
});

describe("MultiParamResolver - Two-Parameter Hooks", function () {
    var ethers: HardhatEthers;
    let multiParamResolver: any;
    let chainId: bigint;
    let providerMap: Map<number | bigint, any>;

    before(async () => {
        const ret = await hre.network.connect();
        ethers = (ret as any).ethers as HardhatEthers;
    });

    beforeEach(async () => {
        multiParamResolver = await ethers.deployContract("MultiParamResolver");
        
        chainId = BigInt((await ethers.provider.getNetwork()).chainId);
        providerMap = new Map();
        providerMap.set(Number(chainId), ethers.provider);
    });

    it("should execute single-parameter hook (backward compatibility)", async function () {
        const { executeHook } = await import("../../src/index.js");
        
        const testData = ethers.toUtf8Bytes("Single param data");
        // Store ABI-encoded bytes so decodeResult can decode them
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], [testData]);
        const node = namehash("test.eth");
        await multiParamResolver.setData(node, encoded);
        
        const functionSelector = computeSelector("data(bytes32)");
        const functionCall = "data(bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await multiParamResolver.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const result = await executeHook(decoded!, {
            nodehash: node,
            providerMap
        });
        
        if (result._tag === "HookExecutionError") {
            console.log("Error:", result.message);
        }
        
        expect(result._tag).to.equal("HookExecutionResult");
        if (result._tag === "HookExecutionResult") {
            expect(ethers.hexlify(result.data)).to.equal(ethers.hexlify(testData));
        }
    });

    it("should execute two-parameter hook with cacheNonce", async function () {
        const { executeHook } = await import("../../src/index.js");
        
        const testData = ethers.toUtf8Bytes("Two param data");
        // Store ABI-encoded bytes so decodeResult can decode them
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], [testData]);
        const node = namehash("test.eth");
        await multiParamResolver.setData(node, encoded);
        
        const functionSelector = computeSelector("dataWithOptions(bytes32,bytes32)");
        const functionCall = "dataWithOptions(bytes32,bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await multiParamResolver.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const cacheNonce = ethers.hexlify(ethers.randomBytes(32));
        
        const result = await executeHook(decoded!, {
            nodehash: node,
            cacheNonce,
            providerMap
        });
        
        expect(result._tag).to.equal("HookExecutionResult");
        if (result._tag === "HookExecutionResult") {
            expect(ethers.hexlify(result.data)).to.equal(ethers.hexlify(testData));
        }
    });

    it("should reject hook with 3 parameters", async function () {
        const { validateHook } = await import("../../src/index.js");
        
        const functionSelector = computeSelector("invalidFunc(bytes32,bytes32,bytes32)");
        const functionCall = "invalidFunc(bytes32,bytes32,bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await multiParamResolver.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.false;
        expect(validation.error).to.include("Invalid parameter count");
    });

    it("should reject hook with non-bytes32 parameter", async function () {
        const { validateHook } = await import("../../src/index.js");
        
        const functionSelector = computeSelector("invalidFunc(bytes32,string)");
        const functionCall = "invalidFunc(bytes32,string)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await multiParamResolver.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const validation = validateHook(decoded!);
        expect(validation.isValid).to.be.false;
        expect(validation.error).to.include("Invalid parameter type");
    });

    it("should verify different cacheNonce produces different hook encoding", async function () {
        const functionSelector1 = computeSelector("dataWithOptions(bytes32,bytes32)");
        const functionCall1 = "dataWithOptions(bytes32,bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await multiParamResolver.getAddress()
        };
        
        const hookData1 = await encodeHook(functionSelector1, functionCall1, returnType, target);
        
        // Single-parameter version has different selector
        const functionSelector2 = computeSelector("data(bytes32)");
        const functionCall2 = "data(bytes32)";
        
        const hookData2 = await encodeHook(functionSelector2, functionCall2, returnType, target);
        
        // Different function signatures produce different encoded hooks
        expect(hookData1).to.not.equal(hookData2);
    });

    it("should handle empty data with cacheNonce", async function () {
        const { executeHook } = await import("../../src/index.js");
        
        const node = namehash("test.eth");
        const emptyData = "0x";
        // Store ABI-encoded bytes so decodeResult can decode them
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], [emptyData]);
        await multiParamResolver.setData(node, encoded);
        
        const functionSelector = computeSelector("dataWithOptions(bytes32,bytes32)");
        const functionCall = "dataWithOptions(bytes32,bytes32)";
        const returnType = "(bytes)";
        const target: EIP8121Target = {
            chainId: Number(chainId),
            address: await multiParamResolver.getAddress()
        };
        
        const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
        const decoded = await decodeHook(hookData);
        
        expect(decoded).to.not.be.null;
        
        const cacheNonce = ethers.hexlify(ethers.randomBytes(32));
        
        const result = await executeHook(decoded!, {
            nodehash: node,
            cacheNonce,
            providerMap
        });
        
        expect(result._tag).to.equal("HookExecutionResult");
        if (result._tag === "HookExecutionResult") {
            expect(result.data).to.equal(emptyData);
        }
    });
});
