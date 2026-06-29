import {
    tryDecodeDataUri,
    tryDecodeEIP8121HookFromContenthash,
    decodeHook,
} from "../src/index.js";

function printUsage(): void {
    console.log(`Usage:\n  npx hardhat run scripts/decode-contenthash.ts --network hardhat -- --contenthash <hex>\n\nOptions:\n  --contenthash <hex>  ENS contenthash bytes\n  --help               Show help\n`);
}

function parseArgs(argv: string[]): { contenthash: string } {
    let contenthash: string | undefined;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--help") {
            printUsage();
            process.exit(0);
        }

        if (arg === "--contenthash") {
            contenthash = argv[++i];
            continue;
        }

        if (arg === "--") {
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!contenthash) {
        throw new Error("Missing required --contenthash argument.");
    }

    return { contenthash };
}

async function main(): Promise<void> {
    const { contenthash } = parseArgs(process.argv.slice(2));

    const uri = tryDecodeDataUri(contenthash);
    if (uri) {
        console.log(JSON.stringify({
            type: "uri",
            uri,
        }, null, 2));
        return;
    }

    const hookData = tryDecodeEIP8121HookFromContenthash(contenthash);
    if (!hookData) {
        console.log(JSON.stringify({
            type: "unknown",
        }, null, 2));
        return;
    }

    const decodedHook = await decodeHook(hookData);
    console.log(JSON.stringify({
        type: "hook",
        hookData,
        decodedHook,
    }, null, 2));
}

main().catch((error) => {
    console.error("decode-contenthash failed:", error instanceof Error ? error.message : error);
    process.exit(1);
});
