import { expect } from "chai";
import hre from "hardhat";
import { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import { 
    encodeHook, 
    executeHook,
    decodeHook,
    type ProviderMap 
} from "../src/index.js";

describe("FunctionCall Parser Tests", function() {
    let ethers: HardhatEthers;
    let testContract: any;
    let providerMap: ProviderMap;
    let chainId: number;
    let contractAddress: string;

    before(async function() {
        const ret = await hre.network.connect();
        ethers = (ret as any).ethers as HardhatEthers;
        
        const FunctionCallParserTest = await ethers.getContractFactory("FunctionCallParserTest");
        testContract = await FunctionCallParserTest.deploy();
        await testContract.waitForDeployment();
        
        contractAddress = await testContract.getAddress();
        const network = await ethers.provider.getNetwork();
        chainId = Number(network.chainId);
        providerMap = new Map([[chainId, ethers.provider]]);
    });

    describe("String Parameter Tests", function() {
        it("should handle simple string parameter", async function() {
            const hookData = await encodeHook(
                "getStringParam(string)",
                "getStringParam('Hello, World!')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
            if (result._tag === "HookExecutionResult") {
                const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['string'], result.data);
                expect(decodedResult[0]).to.equal("Hello, World!");
            }
        });

        it("should handle empty string", async function() {
            const hookData = await encodeHook(
                "getEmptyString(string)",
                "getEmptyString('')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle string with escaped quotes", async function() {
            const hookData = await encodeHook(
                "getStringWithQuotes(string)",
                "getStringWithQuotes('It\\'s working')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
            if (result._tag === "HookExecutionResult") {
                const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['string'], result.data);
                expect(decodedResult[0]).to.equal("It's working");
            }
        });

        it("should handle string with escaped backslashes", async function() {
            const hookData = await encodeHook(
                "getStringWithBackslash(string)",
                "getStringWithBackslash('path\\\\to\\\\file')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
            if (result._tag === "HookExecutionResult") {
                const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['string'], result.data);
                expect(decodedResult[0]).to.equal("path\\to\\file");
            }
        });

        it("should handle string with newline characters", async function() {
            const hookData = await encodeHook(
                "getStringWithNewline(string)",
                "getStringWithNewline('Line 1\nLine 2')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
            if (result._tag === "HookExecutionResult") {
                const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['string'], result.data);
                expect(decodedResult[0]).to.equal("Line 1\nLine 2");
            }
        });

        it("should handle string with Unicode characters", async function() {
            const hookData = await encodeHook(
                "getStringWithUnicode(string)",
                "getStringWithUnicode('Hello 世界 🌍')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
            if (result._tag === "HookExecutionResult") {
                const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['string'], result.data);
                expect(decodedResult[0]).to.equal("Hello 世界 🌍");
            }
        });

        it("should handle 512 character string (max length)", async function() {
            const maxString = 'a'.repeat(512);
            const hookData = await encodeHook(
                "getMaxString(string)",
                `getMaxString('${maxString}')`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject string exceeding 512 characters", async function() {
            const tooLong = 'a'.repeat(513);
            await expect(
                encodeHook(
                    "getStringParam(string)",
                    `getStringParam('${tooLong}')`,
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/string too long/);
        });

        it("should reject unterminated string", async function() {
            await expect(
                encodeHook(
                    "getStringParam(string)",
                    "getStringParam('unterminated)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/missing closing quote/);
        });

        it("should reject invalid escape sequence", async function() {
            await expect(
                encodeHook(
                    "getStringParam(string)",
                    "getStringParam('invalid\\nescape')",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/Invalid escape sequence/);
        });
    });

    describe("Boolean Parameter Tests", function() {
        it("should handle true boolean", async function() {
            const hookData = await encodeHook(
                "getBoolTrue(bool)",
                "getBoolTrue(true)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle false boolean", async function() {
            const hookData = await encodeHook(
                "getBoolFalse(bool)",
                "getBoolFalse(false)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject invalid boolean value", async function() {
            await expect(
                encodeHook(
                    "getBoolTrue(bool)",
                    "getBoolTrue(True)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/expected 'true' or 'false'/);
        });
    });

    describe("Address Parameter Tests", function() {
        it("should handle valid address", async function() {
            const addr = "0x1234567890123456789012345678901234567890";
            const hookData = await encodeHook(
                "getAddress(address)",
                `getAddress(${addr})`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle zero address", async function() {
            const hookData = await encodeHook(
                "getZeroAddress(address)",
                "getZeroAddress(0x0000000000000000000000000000000000000000)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle mixed case address", async function() {
            const addr = "0xAbCdEf1234567890aBcDeF1234567890AbCdEf12";
            const hookData = await encodeHook(
                "getAddress(address)",
                `getAddress(${addr})`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject invalid address format", async function() {
            await expect(
                encodeHook(
                    "getAddress(address)",
                    "getAddress(0x123)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/invalid address format/);
        });
    });

    describe("Uint Parameter Tests", function() {
        it("should handle decimal uint256", async function() {
            const hookData = await encodeHook(
                "getUint256(uint256)",
                "getUint256(12345)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle hex uint256", async function() {
            const hookData = await encodeHook(
                "getHexUint(uint256)",
                "getHexUint(0x1234abcd)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle uppercase hex prefix (0X) uint256", async function() {
            const hookData = await encodeHook(
                "getHexUint(uint256)",
                "getHexUint(0X1234ABCD)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle zero uint256", async function() {
            const hookData = await encodeHook(
                "getUint256Zero(uint256)",
                "getUint256Zero(0)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle max uint256", async function() {
            const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
            const hookData = await encodeHook(
                "getUint256Max(uint256)",
                `getUint256Max(${maxUint256})`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle uint8", async function() {
            const hookData = await encodeHook(
                "getUint8(uint8)",
                "getUint8(255)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject negative uint", async function() {
            await expect(
                encodeHook(
                    "getUint256(uint256)",
                    "getUint256(-123)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/cannot be negative/);
        });

        it("should reject uint8 value exceeding 255", async function() {
            await expect(
                encodeHook(
                    "getUint8(uint8)",
                    "getUint8(256)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/out of range/);
        });

        it("should accept uint8 max value (255)", async function() {
            const hookData = await encodeHook(
                "getUint8(uint8)",
                "getUint8(255)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject uint256 value exceeding max", async function() {
            const overflowUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639936";
            await expect(
                encodeHook(
                    "getUint256Max(uint256)",
                    `getUint256Max(${overflowUint256})`,
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/out of range/);
        });
    });

    describe("Int Parameter Tests", function() {
        it("should handle positive int256", async function() {
            const hookData = await encodeHook(
                "getInt256(int256)",
                "getInt256(12345)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle negative int256", async function() {
            const hookData = await encodeHook(
                "getInt256Negative(int256)",
                "getInt256Negative(-12345)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle max int256", async function() {
            const maxInt256 = "57896044618658097711785492504343953926634992332820282019728792003956564819967";
            const hookData = await encodeHook(
                "getInt256Max(int256)",
                `getInt256Max(${maxInt256})`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle min int256", async function() {
            const minInt256 = "-57896044618658097711785492504343953926634992332820282019728792003956564819968";
            const hookData = await encodeHook(
                "getInt256Min(int256)",
                `getInt256Min(${minInt256})`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject int8 value exceeding 127", async function() {
            await expect(
                encodeHook(
                    "getInt256(int256)",
                    "getInt256(128)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.fulfilled; // int256 can hold 128

            await expect(
                encodeHook(
                    "getInt8(int8)",
                    "getInt8(128)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/out of range/);
        });

        it("should accept int8 max value (127)", async function() {
            const hookData = await encodeHook(
                "getInt8(int8)",
                "getInt8(127)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            expect(hookData).to.be.a("string");
        });

        it("should accept int8 min value (-128)", async function() {
            const hookData = await encodeHook(
                "getInt8(int8)",
                "getInt8(-128)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            expect(hookData).to.be.a("string");
        });

        it("should reject int8 value below -128", async function() {
            await expect(
                encodeHook(
                    "getInt8(int8)",
                    "getInt8(-129)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/out of range/);
        });

        it("should reject int256 value exceeding max", async function() {
            const overflowInt256 = "57896044618658097711785492504343953926634992332820282019728792003956564819968";
            await expect(
                encodeHook(
                    "getInt256Max(int256)",
                    `getInt256Max(${overflowInt256})`,
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/out of range/);
        });

        it("should reject int256 value below min", async function() {
            const underflowInt256 = "-57896044618658097711785492504343953926634992332820282019728792003956564819969";
            await expect(
                encodeHook(
                    "getInt256Min(int256)",
                    `getInt256Min(${underflowInt256})`,
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/out of range/);
        });
    });

    describe("DoS Protection Tests", function() {
        it("should reject excessively long decimal integer string", async function() {
            // Create a string with 80 digits (exceeds max of 79)
            const tooLongDecimal = "1".repeat(80);
            await expect(
                encodeHook(
                    "getUint256(uint256)",
                    `getUint256(${tooLongDecimal})`,
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/numeric string too long/);
        });

        it("should reject excessively long hex integer string", async function() {
            // Create a hex string with 67 chars (exceeds max of 66 including 0x)
            const tooLongHex = "0x" + "f".repeat(65);
            await expect(
                encodeHook(
                    "getUint256(uint256)",
                    `getUint256(${tooLongHex})`,
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/numeric string too long/);
        });

        it("should accept max length decimal integer string (79 chars)", async function() {
            // Max length is 79 chars (78 digits for uint256, plus 1 for potential sign in int types)
            // This test uses 79 digits which exceeds uint256 max but should pass length validation
            const maxLengthDecimal = "1".repeat(79);
            // This will fail range validation but should pass length check
            await expect(
                encodeHook(
                    "getUint256(uint256)",
                    `getUint256(${maxLengthDecimal})`,
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/out of range/); // Fails range, not length
        });

        it("should accept max length hex integer string (66 chars)", async function() {
            // 66 chars is the max (0x + 64 hex digits)
            // Use 0x0 followed by 63 f's to stay within uint256 range
            const maxLengthHex = "0x0" + "f".repeat(63);
            const hookData = await encodeHook(
                "getUint256(uint256)",
                `getUint256(${maxLengthHex})`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            expect(hookData).to.be.a("string");
        });
    });

    describe("BytesN Parameter Tests", function() {
        it("should handle bytes32", async function() {
            const hash = "0x1234567890123456789012345678901234567890123456789012345678901234";
            const hookData = await encodeHook(
                "getBytes32(bytes32)",
                `getBytes32(${hash})`,
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle zero bytes32", async function() {
            const hookData = await encodeHook(
                "getBytes32Zero(bytes32)",
                "getBytes32Zero(0x0000000000000000000000000000000000000000000000000000000000000000)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle bytes1", async function() {
            const hookData = await encodeHook(
                "getBytes1(bytes1)",
                "getBytes1(0xff)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject wrong length bytes", async function() {
            await expect(
                encodeHook(
                    "getBytes32(bytes32)",
                    "getBytes32(0x1234)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/expected 64 hex characters/);
        });
    });

    describe("Mixed Parameter Tests (2 parameters)", function() {
        it("should handle string and uint", async function() {
            const hookData = await encodeHook(
                "getStringAndUint(string,uint256)",
                "getStringAndUint('test', 42)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle address and bool", async function() {
            const hookData = await encodeHook(
                "getAddressAndBool(address,bool)",
                "getAddressAndBool(0x1234567890123456789012345678901234567890, true)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle bytes32 and string", async function() {
            const hookData = await encodeHook(
                "getBytes32AndString(bytes32,string)",
                "getBytes32AndString(0x1234567890123456789012345678901234567890123456789012345678901234, 'hello')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle two strings", async function() {
            const hookData = await encodeHook(
                "getTwoStrings(string,string)",
                "getTwoStrings('first', 'second')",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should handle uint and int", async function() {
            const hookData = await encodeHook(
                "getUintAndInt(uint256,int256)",
                "getUintAndInt(12345, -6789)",
                "(bytes)",
                { chainId, address: contractAddress }
            );
            
            const decoded = await decodeHook(hookData);
            const result = await executeHook(decoded!, { providerMap });
            
            expect(result._tag).to.equal("HookExecutionResult");
        });

        it("should reject missing comma between parameters", async function() {
            await expect(
                encodeHook(
                    "getStringAndUint(string,uint256)",
                    "getStringAndUint('test' 42)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/Expected comma/);
        });
    });

    describe("Error Cases", function() {
        it("should reject more than 2 parameters", async function() {
            await expect(
                encodeHook(
                    "invalid(uint256,uint256,uint256)",
                    "invalid(1, 2, 3)",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/Maximum 2 parameters allowed/);
        });

        it("should reject parameter count mismatch", async function() {
            await expect(
                encodeHook(
                    "getStringAndUint(string,uint256)",
                    "getStringAndUint('test')",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/Expected comma|Parameter count mismatch/);
        });

        it("should reject function name mismatch", async function() {
            await expect(
                encodeHook(
                    "getStringParam(string)",
                    "wrongName('test')",
                    "(bytes)",
                    { chainId, address: contractAddress }
                )
            ).to.be.rejectedWith(/Function name mismatch/);
        });
    });
});
