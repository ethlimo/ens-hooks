import { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import hre from "hardhat";
import { expect } from "chai";
import { 
    encodeHook,
    decodeHook,
    computeSelector,
    extractFunctionName,
    parseParameterTypes,
    isAllowedParameterType,
    validateFunctionCallMatchesSignature,
    encodeERC7930Target,
    decodeERC7930Target,
    isEIP8121Hook,
    encodeEIP8121HookForContenthash,
    tryDecodeEIP8121HookFromContenthash,
    encodeDataUri,
    tryDecodeDataUri,
    type EIP8121Target
} from "../../src/dataurl/encoding.js";
import { detectAndDecodeHook } from "../../src/dataurl/index.js";
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
            // data(bytes32) from IDataResolver
            const dataSelector = computeSelector("data(bytes32)");
            expect(dataSelector).to.equal("0x0147fb0c");
        });
    });

    describe("Function Name Extraction", function () {
        it("should extract function name from signature", function () {
            const functionSignature = "data(bytes32)";
            const name = extractFunctionName(functionSignature);
            expect(name).to.equal("data");
        });

        it("should extract function name from call", function () {
            const functionCall = "getData(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const name = extractFunctionName(functionCall);
            expect(name).to.equal("getData");
        });

        it("should throw on invalid format", function () {
            expect(() => extractFunctionName("invalidformat")).to.throw();
        });
    });

    describe("Parameter Type Validation", function () {
        it("should accept allowed parameter types", function () {
            const validTypes = [
                "bool",
                "address",
                "string",  // Now supported!
                "uint8", "uint16", "uint32", "uint64", "uint128", "uint256",
                "int8", "int16", "int32", "int64", "int128", "int256",
                "bytes1", "bytes2", "bytes4", "bytes8", "bytes16", "bytes32"
            ];
            
            for (const type of validTypes) {
                expect(isAllowedParameterType(type), `${type} should be valid`).to.be.true;
            }
        });

        it("should reject dynamic types", function () {
            const invalidTypes = [
                "bytes",  // Dynamic bytes not supported
                "uint256[]",
                "address[]",
                "(uint256,string)"
            ];
            
            for (const type of invalidTypes) {
                expect(isAllowedParameterType(type), `${type} should be invalid`).to.be.false;
            }
        });

        it("should parse 0 parameter functions", function () {
            const sig = "getData()";
            const params = parseParameterTypes(sig);
            expect(params).to.deep.equal([]);
        });

        it("should parse 1 parameter functions", function () {
            const sig = "getData(bytes32)";
            const params = parseParameterTypes(sig);
            expect(params).to.deep.equal(["bytes32"]);
        });

        it("should parse 2 parameter functions", function () {
            const sig = "getData(bytes32,uint256)";
            const params = parseParameterTypes(sig);
            expect(params).to.deep.equal(["bytes32", "uint256"]);
        });

        it("should throw on too many parameters", function () {
            const sig = "getData(bytes32,uint256,address)";
            expect(() => parseParameterTypes(sig)).to.throw("Too many parameters");
        });

        it("should throw on unsupported parameter type", function () {
            // Dynamic bytes is not supported (but string is now!)
            const sig = "getData(bytes)";
            expect(() => parseParameterTypes(sig)).to.throw("Unsupported parameter type");
        });
    });

    describe("Function Call Validation", function () {
        it("should validate matching function call and signature", function () {
            expect(() => validateFunctionCallMatchesSignature(
                "getData(bytes32)",
                "getData(0x1234567890123456789012345678901234567890123456789012345678901234)"
            )).to.not.throw();
        });

        it("should throw on function name mismatch", function () {
            expect(() => validateFunctionCallMatchesSignature(
                "getData(bytes32)",
                "getInfo(0x1234567890123456789012345678901234567890123456789012345678901234)"
            )).to.throw("Function name mismatch");
        });

        it("should throw on parameter count mismatch", function () {
            expect(() => validateFunctionCallMatchesSignature(
                "getData(bytes32)",
                "getData()"
            )).to.throw("Parameter count mismatch");
        });
    });

    describe("Hook Encoding (Bytes Format)", function () {
        it("should encode hook with 5 parameters (0-param function)", async function () {
            const functionSignature = "getData()";
            const functionCall = "getData()";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            
            // Should start with HOOK_SELECTOR (0x6113bfa3)
            expect(encoded.toLowerCase().startsWith(HOOK_SELECTOR.toLowerCase())).to.be.true;
        });

        it("should encode hook with 5 parameters (1-param function)", async function () {
            const functionSignature = "data(bytes32)";
            const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            
            // Should start with HOOK_SELECTOR (0x6113bfa3)
            expect(encoded.toLowerCase().startsWith(HOOK_SELECTOR.toLowerCase())).to.be.true;
        });

        it("should encode hook with 5 parameters (2-param function)", async function () {
            const functionSignature = "getData(bytes32,bytes32)";
            const functionCall = "getData(0x1234567890123456789012345678901234567890123456789012345678901234,0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            
            // Should start with HOOK_SELECTOR (0x6113bfa3)
            expect(encoded.toLowerCase().startsWith(HOOK_SELECTOR.toLowerCase())).to.be.true;
        });

        it("should decode hook correctly", async function () {
            const functionSignature = "data(bytes32)";
            const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            const decoded = await decodeHook(encoded);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSignature).to.equal(functionSignature);
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target.chainId).to.equal(target.chainId);
            expect(decoded!.target.address.toLowerCase()).to.equal(target.address.toLowerCase());
        });

        it("should roundtrip encode/decode", async function () {
            const functionSignature = "getData(bytes32)";
            const functionCall = "getData(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 10,
                address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            const decoded = await decodeHook(encoded);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSignature).to.equal(functionSignature);
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target).to.deep.equal(target);
        });

        it("should throw on non-bytes return type", async function () {
            const functionSignature = "test(bytes32)";
            const functionCall = "test(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(string)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            try {
                await encodeHook(functionSignature, functionCall, returnType, target);
                expect.fail("Should have thrown on non-bytes return type");
            } catch (error: any) {
                expect(error.message).to.include("Invalid return type");
            }
        });

        it("should throw on parameter count mismatch", async function () {
            const functionSignature = "getData(bytes32)";
            const functionCall = "getData()"; // Missing parameter
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            try {
                await encodeHook(functionSignature, functionCall, returnType, target);
                expect.fail("Should have thrown on parameter count mismatch");
            } catch (error: any) {
                expect(error.message).to.include("Parameter count mismatch");
            }
        });

        it("should handle different fixed-size primitive parameters", async function () {
            const testCases = [
                { sig: "test(bool)", call: "test(true)" },
                { sig: "test(address)", call: "test(0x1234567890123456789012345678901234567890)" },
                { sig: "test(uint256)", call: "test(12345)" },
                { sig: "test(int128)", call: "test(-12345)" },
                { sig: "test(bytes32)", call: "test(0x1234567890123456789012345678901234567890123456789012345678901234)" },
                { sig: "test(bytes32,uint256)", call: "test(0x1234567890123456789012345678901234567890123456789012345678901234,42)" }
            ];
            
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            for (const testCase of testCases) {
                const encoded = await encodeHook(testCase.sig, testCase.call, returnType, target);
                const decoded = await decodeHook(encoded);
                
                expect(decoded).to.not.be.null;
                expect(decoded!.functionSignature).to.equal(testCase.sig);
            }
        });
    });

    describe("Hook Detection", function () {
        it("should detect EIP-8121 hook in bytes format", async function () {
            const functionSignature = "data(bytes32)";
            const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            expect(isEIP8121Hook(encoded)).to.be.true;
        });

        it("should not detect non-hook data", function () {
            expect(isEIP8121Hook("0x1234567890")).to.be.false;
            expect(isEIP8121Hook("0x")).to.be.false;
        });

        it("should detect EIP-8121 hook with PROTOCODE_ETH_CALLDATA prefix", async function () {
            const functionSignature = "data(bytes32)";
            const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            const contenthash = encodeEIP8121HookForContenthash(encoded);
            
            expect(isEIP8121Hook(contenthash)).to.be.true;
        });

        it("should decode hook with PROTOCODE_ETH_CALLDATA prefix via detectAndDecodeHook", async function () {
            const functionSignature = "data(bytes32)";
            const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const encoded = await encodeHook(functionSignature, functionCall, returnType, target);
            const contenthash = encodeEIP8121HookForContenthash(encoded);
            
            const decoded = await detectAndDecodeHook(contenthash);
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSignature).to.equal(functionSignature);
            expect(decoded!.functionCall).to.equal(functionCall);
            expect(decoded!.returnType).to.equal(returnType);
            expect(decoded!.target).to.deep.equal(target);
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
            const functionSignature = "data(bytes32)";
            const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
            const contenthash = encodeEIP8121HookForContenthash(hookData);
            
            // Should be prefixed with ETH_CALLDATA protocol code
            expect(contenthash.startsWith("0x30009b")).to.be.true;
            // Should contain the hook selector after protocol code
            expect(contenthash.toLowerCase()).to.include(HOOK_SELECTOR.toLowerCase().slice(2));
        });

        it("should decode EIP-8121 hook from contenthash", async function () {
            const functionSignature = "data(bytes32)";
            const functionCall = "data(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890"
            };
            
            const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
            const contenthash = encodeEIP8121HookForContenthash(hookData);
            const decoded = tryDecodeEIP8121HookFromContenthash(contenthash);
            
            expect(decoded).to.not.be.null;
            expect(decoded!.toLowerCase()).to.equal(hookData.toLowerCase());
        });

        it("should roundtrip EIP-8121 hook through contenthash", async function () {
            const functionSignature = "getData(bytes32)";
            const functionCall = "getData(0x1234567890123456789012345678901234567890123456789012345678901234)";
            const returnType = "(bytes)";
            const target: EIP8121Target = {
                chainId: 137,
                address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            };
            
            // Encode hook
            const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
            
            // Wrap for contenthash
            const contenthash = encodeEIP8121HookForContenthash(hookData);
            
            // Unwrap from contenthash
            const unwrapped = tryDecodeEIP8121HookFromContenthash(contenthash);
            expect(unwrapped).to.not.be.null;
            
            // Decode hook
            const decoded = await decodeHook(unwrapped!);
            expect(decoded).to.not.be.null;
            expect(decoded!.functionSignature).to.equal(functionSignature);
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
                "data(bytes32)",
                "data(0x1234567890123456789012345678901234567890123456789012345678901234)",
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
