import { readFile } from "node:fs/promises";
import path from "node:path";
import { ethers } from "ethers";

interface BuildCalldataOptions {
    node: string;
    dataUrl?: string;
    dataUrlFile?: string;
    contenthash?: string;
}

function printUsage(): void {
    console.log(`Usage:\n  npx hardhat run scripts/build-setdata-calldata.ts --network hardhat -- --node <name-or-bytes32> (--data-url <url> | --data-url-file <file>) [--contenthash <hex>]\n\nOptions:\n  --node <name-or-bytes32>   ENS name or nodehash\n  --data-url <url>           Data URL string to store\n  --data-url-file <file>     File containing data URL text\n  --contenthash <hex>        Optional contenthash to also build setContenthash calldata\n  --help                     Show help\n`);
}

function parseArgs(argv: string[]): BuildCalldataOptions {
    const options: Partial<BuildCalldataOptions> = {};

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--help") {
            printUsage();
            process.exit(0);
        }

        if (arg === "--node") {
            options.node = argv[++i];
            continue;
        }

        if (arg === "--data-url") {
            options.dataUrl = argv[++i];
            continue;
        }

        if (arg === "--data-url-file") {
            options.dataUrlFile = argv[++i];
            continue;
        }

        if (arg === "--contenthash") {
            options.contenthash = argv[++i];
            continue;
        }

        if (arg === "--") {
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!options.node) {
        throw new Error("Missing required arguments. See --help.");
    }

    if (!options.dataUrl && !options.dataUrlFile) {
        throw new Error("Provide --data-url or --data-url-file.");
    }

    if (options.dataUrl && options.dataUrlFile) {
        throw new Error("Use either --data-url or --data-url-file, not both.");
    }

    return options as BuildCalldataOptions;
}

async function loadDataUrl(options: BuildCalldataOptions): Promise<string> {
    if (options.dataUrl) {
        return options.dataUrl;
    }

    const fromFile = await readFile(path.resolve(options.dataUrlFile as string), "utf8");
    return fromFile.trim();
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const dataUrl = await loadDataUrl(options);
    const node = ethers.isHexString(options.node, 32)
        ? options.node
        : ethers.namehash(options.node);

    const iface = new ethers.Interface(["function setData(bytes32 node, bytes value)"]);
    const dataBytes = ethers.toUtf8Bytes(dataUrl);

    const calldata = iface.encodeFunctionData("setData", [node, dataBytes]);

    let setContenthashCalldata: string | null = null;
    if (options.contenthash) {
        const resolverIface = new ethers.Interface(["function setContenthash(bytes32 node, bytes hash)"]);
        setContenthashCalldata = resolverIface.encodeFunctionData("setContenthash", [
            node,
            options.contenthash,
        ]);
    }

    console.log("setData calldata generated");
    console.log("Node input:", options.node);
    console.log("Node:", node);
    console.log("Data URL bytes:", dataBytes.length);
    console.log("setData calldata:", calldata);
    if (setContenthashCalldata) {
        console.log("setContenthash calldata:", setContenthashCalldata);
    }
}

main().catch((error) => {
    console.error("build-setdata-calldata failed:", error instanceof Error ? error.message : error);
    process.exit(1);
});
