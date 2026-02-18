import { expect } from "chai";
import { 
    verifyTrustedTarget, 
    createTrustedTargets, 
    createTargetKey,
    TrustedTarget,
    TrustedTargets 
} from "../../src/dataurl/trust.js";
import { EIP8121Target } from "../../src/dataurl/encoding.js";

describe("Trust Verification", function () {
    const mainnetResolver: EIP8121Target = {
        chainId: 1,
        address: "0x1234567890123456789012345678901234567890"
    };

    const optimismResolver: EIP8121Target = {
        chainId: 10,
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    };

    const untrustedTarget: EIP8121Target = {
        chainId: 1,
        address: "0x9999999999999999999999999999999999999999"
    };

    describe("Array-based Trust Verification", function () {
        it("should verify trusted target from array", function () {
            const trustedTargets: TrustedTarget[] = [
                { chainId: 1, address: "0x1234567890123456789012345678901234567890" },
                { chainId: 10, address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" }
            ];

            expect(verifyTrustedTarget(mainnetResolver, trustedTargets)).to.be.true;
            expect(verifyTrustedTarget(optimismResolver, trustedTargets)).to.be.true;
        });

        it("should reject untrusted target from array", function () {
            const trustedTargets: TrustedTarget[] = [
                { chainId: 1, address: "0x1234567890123456789012345678901234567890" }
            ];

            expect(verifyTrustedTarget(untrustedTarget, trustedTargets)).to.be.false;
        });

        it("should be case-insensitive for addresses", function () {
            const trustedTargets: TrustedTarget[] = [
                { chainId: 1, address: "0x1234567890123456789012345678901234567890" }
            ];

            const uppercaseTarget: EIP8121Target = {
                chainId: 1,
                address: "0x1234567890123456789012345678901234567890".toUpperCase()
            };

            expect(verifyTrustedTarget(uppercaseTarget, trustedTargets)).to.be.true;
        });

        it("should support descriptions", function () {
            const trustedTargets: TrustedTarget[] = [
                { 
                    chainId: 1, 
                    address: "0x1234567890123456789012345678901234567890",
                    description: "Main ENS Registry"
                }
            ];

            expect(verifyTrustedTarget(mainnetResolver, trustedTargets)).to.be.true;
        });
    });

    describe("Set-based Trust Verification", function () {
        it("should verify trusted target from set", function () {
            const trustedSet = new Set([
                "1:0x1234567890123456789012345678901234567890",
                "10:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            ]);

            expect(verifyTrustedTarget(mainnetResolver, trustedSet)).to.be.true;
            expect(verifyTrustedTarget(optimismResolver, trustedSet)).to.be.true;
        });

        it("should reject untrusted target from set", function () {
            const trustedSet = new Set([
                "1:0x1234567890123456789012345678901234567890"
            ]);

            expect(verifyTrustedTarget(untrustedTarget, trustedSet)).to.be.false;
        });

        it("should handle createTrustedTargets helper", function () {
            const trustedTargets: TrustedTarget[] = [
                { chainId: 1, address: "0x1234567890123456789012345678901234567890" },
                { chainId: 10, address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" }
            ];

            const trustedSet = createTrustedTargets(trustedTargets);

            expect(verifyTrustedTarget(mainnetResolver, trustedSet)).to.be.true;
            expect(verifyTrustedTarget(optimismResolver, trustedSet)).to.be.true;
            expect(verifyTrustedTarget(untrustedTarget, trustedSet)).to.be.false;
        });
    });

    describe("Function-based Trust Verification", function () {
        it("should verify using custom function", function () {
            const trustFunction = (target: EIP8121Target) => {
                // Only trust mainnet
                return target.chainId === 1;
            };

            expect(verifyTrustedTarget(mainnetResolver, trustFunction)).to.be.true;
            expect(verifyTrustedTarget(optimismResolver, trustFunction)).to.be.false;
        });

        it("should support complex trust logic", function () {
            const knownAddresses = new Set([
                "0x1234567890123456789012345678901234567890",
                "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
            ]);

            const trustFunction = (target: EIP8121Target) => {
                // Trust known addresses on mainnet or L2s
                return (target.chainId === 1 || target.chainId === 10 || target.chainId === 137) &&
                       knownAddresses.has(target.address.toLowerCase());
            };

            expect(verifyTrustedTarget(mainnetResolver, trustFunction)).to.be.true;
            expect(verifyTrustedTarget(optimismResolver, trustFunction)).to.be.true;
            
            const polygonResolver: EIP8121Target = {
                chainId: 137,
                address: "0x1234567890123456789012345678901234567890"
            };
            expect(verifyTrustedTarget(polygonResolver, trustFunction)).to.be.true;
            
            // Wrong chain
            const arbitrumResolver: EIP8121Target = {
                chainId: 42161,
                address: "0x1234567890123456789012345678901234567890"
            };
            expect(verifyTrustedTarget(arbitrumResolver, trustFunction)).to.be.false;
        });
    });

    describe("createTargetKey", function () {
        it("should create correct key format", function () {
            const key = createTargetKey(1, "0x1234567890123456789012345678901234567890");
            expect(key).to.equal("1:0x1234567890123456789012345678901234567890");
        });

        it("should lowercase addresses", function () {
            const key = createTargetKey(1, "0x1234567890123456789012345678901234567890".toUpperCase());
            expect(key).to.equal("1:0x1234567890123456789012345678901234567890");
        });

        it("should handle different chain IDs", function () {
            const key1 = createTargetKey(1, "0x1234567890123456789012345678901234567890");
            const key10 = createTargetKey(10, "0x1234567890123456789012345678901234567890");
            
            expect(key1).to.equal("1:0x1234567890123456789012345678901234567890");
            expect(key10).to.equal("10:0x1234567890123456789012345678901234567890");
            expect(key1).to.not.equal(key10);
        });
    });
});
