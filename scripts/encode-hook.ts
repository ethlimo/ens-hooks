import { encodeHook, type EIP8121Target } from "../src/index.js";

interface EncodeHookOptions {
    functionSignature: string;
    functionCall: string;
    returnType: string;
    chainId: number;
    targetAddress: string;
}

function printUsage(): void {
    console.log(`Usage:\n  npx hardhat run scripts/encode-hook.ts --network hardhat -- --function-signature <sig> --function-call <call> --chain-id <id> --target <addr> [options]\n\nOptions:\n  --function-signature <sig>  Solidity signature, e.g. data(bytes32)\n  --function-call <call>      Call with values, e.g. data(0x...)\n  --return-type <type>        Return type (default: (bytes))\n  --chain-id <id>             Target chain ID\n  --target <addr>             Target contract address (alias: --target-address)\n  --help                      Show help\n`);
}

function parseArgs(argv: string[]): EncodeHookOptions {
    const options: Partial<EncodeHookOptions> = {
        returnType: "(bytes)",
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--help") {
            printUsage();
            process.exit(0);
        }

        if (arg === "--function-signature") {
            options.functionSignature = argv[++i];
            continue;
        }

        if (arg === "--function-call") {
            options.functionCall = argv[++i];
            continue;
        }

        if (arg === "--return-type") {
            options.returnType = argv[++i];
            continue;
        }

        if (arg === "--chain-id") {
            options.chainId = Number(argv[++i]);
            continue;
        }

        if (arg === "--target") {
            options.targetAddress = argv[++i];
            continue;
        }

        if (arg === "--target-address") {
            options.targetAddress = argv[++i];
            continue;
        }

        if (arg === "--") {
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!options.functionSignature || !options.functionCall || !options.chainId || !options.targetAddress) {
        throw new Error("Missing required arguments. See --help.");
    }

    return options as EncodeHookOptions;
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));

    const target: EIP8121Target = {
        chainId: options.chainId,
        address: options.targetAddress,
    };

    const hookData = await encodeHook(
        options.functionSignature,
        options.functionCall,
        options.returnType,
        target,
    );

    console.log("Hook encoding complete");
    console.log("Function signature:", options.functionSignature);
    console.log("Function call:", options.functionCall);
    console.log("Return type:", options.returnType);
    console.log("Target chain:", options.chainId);
    console.log("Target address:", options.targetAddress);
    console.log("Hook data:", hookData);
}

main().catch((error) => {
    console.error("encode-hook failed:", error instanceof Error ? error.message : error);
    process.exit(1);
});
