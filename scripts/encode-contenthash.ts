import { encodeEIP8121HookForContenthash } from "../src/index.js";
import { ethers } from "ethers";

function printUsage(): void {
    console.log(`Usage:\n  npx hardhat run scripts/encode-contenthash.ts --network hardhat -- --hook-data <hex>\n\nOptions:\n  --hook-data <hex>  Hook bytes returned by encode-hook\n  --help             Show help\n`);
}

function parseArgs(argv: string[]): { hookData: string } {
    let hookData: string | undefined;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--help") {
            printUsage();
            process.exit(0);
        }

        if (arg === "--hook-data") {
            hookData = argv[++i];
            continue;
        }

        if (arg === "--") {
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!hookData) {
        throw new Error("Missing required --hook-data argument.");
    }

    return { hookData };
}

async function main(): Promise<void> {
    const { hookData } = parseArgs(process.argv.slice(2));
    const contenthash = encodeEIP8121HookForContenthash(hookData);

    console.log("Contenthash encoding complete");
    console.log("Contenthash bytes:", ethers.hexlify(contenthash));
}

main().catch((error) => {
    console.error("encode-contenthash failed:", error instanceof Error ? error.message : error);
    process.exit(1);
});
