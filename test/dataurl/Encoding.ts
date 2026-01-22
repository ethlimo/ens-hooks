import { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import hre from "hardhat";
import { expect } from "chai";
import { 
    encodeHook,
    decodeHook,
    encodeHookString,
    decodeHookString,
    computeSelector,
    parseFunctionCall,
    encodeERC7930Target,
    decodeERC7930Target,
    isEIP8121Hook,
    isEIP8121HookString,
    encodeEIP8121HookForContenthash,
    tryDecodeEIP8121HookFromContenthash,
    encodeDataUri,
    tryDecodeDataUri,
    type EIP8121Target
} from "../../src/dataurl/encoding.js";
import { HOOK_SELECTOR } from "../../src/dataurl/constants.js";

describe("EIP-8121 Hook Encoding", function () {
    var ethers: HardhatEthers;

    before(async () => {
        const ret = await hre.network.connect();
        ethers = (ret as any).ethers as HardhatEthers;
    });

    describe("ERC-7930 Target Encoding", function () {
        it("should encode target with chainId and address", async function () {
            const chainId = 1;
            const address = "0x1234567890123456789012345678901234567890";
            
            const encoded = await encodeERC7930Target(chainId, address);
            const bytes = ethers.getBytes(encoded);
            
            // ERC-7930 format: 2 bytes version + 2 bytes chainType + 1 byte chainRefLen + N bytes chainRef + 1 byte addressLen + M bytes address
            // For EIP-155 with chainId=1 and 20-byte address: 2 + 2 + 1 + 1 + 1 + 20 = 27 bytes minimum
            expect(bytes.length).to.be.greaterThan(20); // At least the address plus metadata
        });

        it("should decode target correctly", async function () {
            const chainId = 1;
            const address = "0x1234567890123456789012345678901234567890";
            
            const encoded = await encodeERC7930Target(chainId, address);
            const decoded = await decodeERC7930Target(encoded);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.chainId).to.equal(chainId);
            expect(decoded!.address.toLowerCase()).to.equal(address.toLowerCase());
        });

        it("should handle different chain IDs", async function () {
            const testCases = [
                { chainId: 1, name: "Ethereum Mainnet" },
                { chainId: 10, name: "Optimism" },
                { chainId: 137, name: "Polygon" },
                { chainId: 42161, name: "Arbitrum" }
            ];
            
            const address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
            
            for (const testCase of testCases) {
                const encoded = await encodeERC7930Target(testCase.chainId, address);
                const decoded = await decodeERC7930Target(encoded);
                
                expect(decoded).to.not.be.null;
                expect(decoded!.chainId).to.equal(testCase.chainId);
                expect(decoded!.address.toLowerCase()).to.equal(address.toLowerCase());
            }
        });

        it("should return null for invalid target", async function () {
            const invalid = "0x1234";
            const decoded = await decodeERC7930Target(invalid);
            expect(decoded).to.be.null;
        });

        it("should roundtrip encode/decode", async function () {
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x0000000000000000000000000000000000000000"
            };
            
            const encoded = await encodeERC7930Target(target.chainId, target.address);
            const decoded = await decodeERC7930Target(encoded);
            
            expect(decoded).to.deep.equal(target);
        });
    });

    describe("Selector Computation", function () {
        it("should compute selector correctly", function () {
            const signature = "data(bytes32)";
            const selector = computeSelector(signature);
            
            // Selector should be 10 characters (0x + 8 hex chars)
            expect(selector.length).to.equal(10);
            expect(selector).to.match(/^0x[0-9a-f]{8}$/);
        });

        it("should match known selectors", function () {
            // data(bytes32,string) from IDataResolver
            const dataSelector = computeSelector("data(bytes32,string)");
            expect(dataSelector).to.equal("0xecbfada3");
        });
    });

    describe("Function Call Parsing", function () {
        it("should parse simple function calls", function () {
            const functionCall = "data(bytes32)";
            const name = parseFunctionCall(functionCall);
            expect(name).to.equal("data");
        });

        it("should parse function calls with multiple parameters", function () {
            const functionCall = "getData(bytes32,string)";
            const name = parseFunctionCall(functionCall);
            expect(name).to.equal("getData");
        });

        it("should throw on invalid format", function () {
            expect(() => parseFunctionCall("invalidformat")).to.throw();
        });
    });

    describe("Hook Encoding (Bytes Format)", function () {
        it("should encode hook with 4 parameters", async function () {
            const functionSelector = computeSelector("data(bytes32)");
            const functionCall = "data(bytes32)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSelector, functionCall, returnType, target);
            
            // Should start with HOOK_SELECTOR
            expect(encoded.toLowerCase().startsWith(HOOK_SELECTOR.toLowerCase())).to.be.true;
        });

        it("should decode hook correctly", async function () {
            const functionSelector = computeSelector("data(bytes32)");
            const functionCall = "data(bytes32)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSelector, functionCall, returnType, target);
            const decoded = await decodeHook(encoded);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSelector.toLowerCase()).to.equal(functionSelector.toLowerCase());
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target.chainId).to.equal(target.chainId);
            expect(decoded!.target.address.toLowerCase()).to.equal(target.address.toLowerCase());
        });

        it("should roundtrip encode/decode", async function () {
            const functionSelector = "0x12345678";
            const functionCall = "getData(bytes32)";
            const returnType = "(string)";
            const target: EIP8121Target = {
                chainId: 10,
                address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            };
            
            const encoded = await encodeHook(functionSelector, functionCall, returnType, target);
            const decoded = await decodeHook(encoded);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSelector.toLowerCase()).to.equal(functionSelector.toLowerCase());
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target).to.deep.equal(target);
        });

        it("should handle different return types", async function () {
            const testCases = [
                "(string)",
                "(bytes)",
                "(uint256)",
                "(address)",
                "(string,uint256)",
                "(string,uint256,bytes32)",
                "((string,uint256))"
            ];
            
            const functionSelector = computeSelector("test(bytes32)");
            const functionCall = "test(bytes32)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            for (const returnType of testCases) {
                const encoded = await encodeHook(functionSelector, functionCall, returnType, target);
                const decoded = await decodeHook(encoded);
                
                expect(decoded).to.not.be.null;
                expect(decoded!.returnType).to.equal(returnType);
            }
        });
    });

    describe("Hook Encoding (String Format)", function () {
        it("should encode hook string format", async function () {
            const functionSelector = "0x12345678";
            const functionCall = "data(bytes32)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHookString(functionSelector, functionCall, returnType, target);
            
            expect(encoded).to.include("hook(");
            expect(encoded).to.include(functionSelector);
            expect(encoded).to.include(functionCall);
            expect(encoded).to.include(returnType);
        });

        it("should decode hook string format", async function () {
            const functionSelector = "0x12345678";
            const functionCall = "data(bytes32)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHookString(functionSelector, functionCall, returnType, target);
            const decoded = await decodeHookString(encoded);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSelector.toLowerCase()).to.equal(functionSelector.toLowerCase());
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target.chainId).to.equal(target.chainId);
            expect(decoded!.target.address.toLowerCase()).to.equal(target.address.toLowerCase());
        });

        it("should roundtrip string format", async function () {
            const functionSelector = computeSelector("getData(bytes32)");
            const functionCall = "getData(bytes32)";
            const returnType = "(string,uint256)";
            const target: EIP8121Target = {
                chainId: 137,
                address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            };
            
            const encoded = await encodeHookString(functionSelector, functionCall, returnType, target);
            const decoded = await decodeHookString(encoded);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSelector.toLowerCase()).to.equal(functionSelector.toLowerCase());
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target).to.deep.equal(target);
        });
    });

    describe("Hook Detection", function () {
        it("should detect EIP-8121 hook in bytes format", async function () {
            const functionSelector = computeSelector("data(bytes32)");
            const functionCall = "data(bytes32)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSelector, functionCall, returnType, target);
            expect(isEIP8121Hook(encoded)).to.be.true;
        });

        it("should not detect non-hook data", function () {
            expect(isEIP8121Hook("0x1234567890")).to.be.false;
            expect(isEIP8121Hook("0x")).to.be.false;
        });

        it("should detect EIP-8121 hook string format", function () {
            const hookString = 'hook(0x12345678, "data(bytes32)", "(bytes)", 0x0000000000000001...)';
            expect(isEIP8121HookString(hookString)).to.be.true;
        });

        it("should not detect non-hook strings", function () {
            expect(isEIP8121HookString("https://example.com")).to.be.false;
            expect(isEIP8121HookString("data:text/html,...")).to.be.false;
            expect(isEIP8121HookString("random string")).to.be.false;
        });
    });

    describe("Contenthash Support", function () {
        it("should encode plain URI for contenthash", function () {
            const uri = "https://example.com";
            const encoded = encodeDataUri(uri);
            
            // Should be prefixed with protocol code
            expect(encoded.startsWith("0x3000f2")).to.be.true;
        });

        it("should decode plain URI from contenthash", function () {
            const uri = "https://example.com";
            const encoded = encodeDataUri(uri);
            const decoded = tryDecodeDataUri(encoded);
            
            expect(decoded).to.equal(uri);
        });

        it("should roundtrip plain URI", function () {
            const testUris = [
                "https://example.com",
                "data:text/html,<html><body>Hello</body></html>",
                "ipfs://QmTest123",
                "ar://test-arweave-hash"
            ];
            
            for (const uri of testUris) {
                const encoded = encodeDataUri(uri);
                const decoded = tryDecodeDataUri(encoded);
                expect(decoded).to.equal(uri);
            }
        });

        it("should encode EIP-8121 hook for contenthash", async function () {
            const functionSelector = computeSelector("data(bytes32)");
            const functionCall = "data(bytes32)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
            const contenthash = encodeEIP8121HookForContenthash(hookData);
            
            // Should be prefixed with ETH_CALLDATA protocol code
            expect(contenthash.startsWith("0x30009b")).to.be.true;
            // Should contain the hook selector after protocol code
            expect(contenthash.toLowerCase()).to.include(HOOK_SELECTOR.toLowerCase().slice(2));
        });

        it("should decode EIP-8121 hook from contenthash", async function () {
            const functionSelector = computeSelector("data(bytes32)");
            const functionCall = "data(bytes32)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
            const contenthash = encodeEIP8121HookForContenthash(hookData);
            const decoded = tryDecodeEIP8121HookFromContenthash(contenthash);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.toLowerCase()).to.equal(hookData.toLowerCase());
        });

        it("should roundtrip EIP-8121 hook through contenthash", async function () {
            const functionSelector = computeSelector("getData(bytes32)");
            const functionCall = "getData(bytes32)";
            const returnType = "(string,uint256)";
            const target: EIP8121Target = {
                chainId: 137,
                address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            };
            
            // Encode hook
            const hookData = await encodeHook(functionSelector, functionCall, returnType, target);
            
            // Wrap for contenthash
            const contenthash = encodeEIP8121HookForContenthash(hookData);
            
            // Unwrap from contenthash
            const unwrapped = tryDecodeEIP8121HookFromContenthash(contenthash);
            expect(unwrapped).to.not.be.null;
            
            // Decode hook
            const decoded = await decodeHook(unwrapped!);
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSelector.toLowerCase()).to.equal(functionSelector.toLowerCase());
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target).to.deep.equal(target);
        });

        it("should return null for invalid contenthash protocol code", function () {
            const invalid = "0x999999123456";
            const decodedUri = tryDecodeDataUri(invalid);
            const decodedHook = tryDecodeEIP8121HookFromContenthash(invalid);
            
            expect(decodedUri).to.be.null;
            expect(decodedHook).to.be.null;
        });

        it("should distinguish between URI and hook contenthash", async function () {
            const uri = "https://example.com";
            const encodedUri = encodeDataUri(uri);
            
            const hookData = await encodeHook(
                computeSelector("data(bytes32)"),
                "data(bytes32)",
                "(bytes)",
                { chainId: 1, address: "0x1234567890123456789012345678901234567890" }
            );
            const encodedHook = encodeEIP8121HookForContenthash(hookData);
            
            // URI should decode as URI, not as hook
            expect(tryDecodeDataUri(encodedUri)).to.equal(uri);
            expect(tryDecodeEIP8121HookFromContenthash(encodedUri)).to.be.null;
            
            // Hook should decode as hook, not as URI
            expect(tryDecodeEIP8121HookFromContenthash(encodedHook)).to.not.be.null;
            expect(tryDecodeDataUri(encodedHook)).to.be.null;
        });
    });
});
