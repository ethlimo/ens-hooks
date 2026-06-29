import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "html-minifier-terser";
import { ethers, namehash } from "ethers";
import {
    encodeHook,
    encodeEIP8121HookForContenthash,
    type EIP8121Target,
} from "../src/index.js";

interface FullEncodeOptions {
    artifact: string;
    name: string;
    chainId: number;
    dataResolverAddress: string;
    mime?: string;
    minifyHtml: boolean;
    out?: string;
}

interface FullEncodeOutput {
    name: string;
    node: string;
    dataUrl: string;
    dataUrlString: string;
    functionSignature: string;
    functionCall: string;
    hookData: string;
    contenthash: string;
    setDataCalldata: string;
    setContenthashCalldata: string;
    lengths: {
        artifactBytes: number;
        dataUrlChars: number;
        dataUrlBytes: number;
        hookDataBytes: number;
        contenthashBytes: number;
    };
}

function printUsage(): void {
    console.log(`Usage:\n  npm run encode-full -- --file <file> --node <ens-name-or-bytes32> --chain-id <id> --target <addr> [options]\n\nOptions:\n  --file <file>                 Artifact file path (alias: --artifact)\n  --node <name|bytes32>         ENS name or nodehash (alias: --name)\n  --chain-id <id>               Target chain ID for hook target\n  --target <addr>               DataResolver contract address (alias: --data-resolver-address)\n  --mime <mime>                 Override MIME type\n  --minify-html                 Minify HTML before encoding\n  --out <file>                  Write full JSON result to file\n  --help                        Show help\n\nData URL output is always base64.\n`);
}

function inferMime(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".html":
        case ".htm":
            return "text/html";
        case ".json":
            return "application/json";
        case ".js":
            return "text/javascript";
        case ".css":
            return "text/css";
        case ".svg":
            return "image/svg+xml";
        case ".txt":
            return "text/plain";
        case ".png":
            return "image/png";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".gif":
            return "image/gif";
        case ".webp":
            return "image/webp";
        default:
            return "application/octet-stream";
    }
}

function parseArgs(argv: string[]): FullEncodeOptions {
    const options: Partial<FullEncodeOptions> = {
        minifyHtml: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--help") {
            printUsage();
            process.exit(0);
        }

        if (arg === "--file") {
            options.artifact = argv[++i];
            continue;
        }

        if (arg === "--artifact") {
            options.artifact = argv[++i];
            continue;
        }

        if (arg === "--node") {
            options.name = argv[++i];
            continue;
        }

        if (arg === "--name") {
            options.name = argv[++i];
            continue;
        }

        if (arg === "--chain-id") {
            options.chainId = Number(argv[++i]);
            continue;
        }

        if (arg === "--target") {
            options.dataResolverAddress = argv[++i];
            continue;
        }

        if (arg === "--data-resolver-address") {
            options.dataResolverAddress = argv[++i];
            continue;
        }

        if (arg === "--mime") {
            options.mime = argv[++i];
            continue;
        }

        if (arg === "--minify-html") {
            options.minifyHtml = true;
            continue;
        }

        if (arg === "--out") {
            options.out = argv[++i];
            continue;
        }

        if (arg === "--") {
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!options.artifact || !options.name || !options.chainId || !options.dataResolverAddress) {
        throw new Error("Missing required arguments. See --help.");
    }

    return options as FullEncodeOptions;
}

function buildDataUrl(mime: string, data: Buffer): string {
    return `data:${mime};base64,${data.toString("base64")}`;
}

async function maybeMinifyHtml(content: string, shouldMinify: boolean): Promise<string> {
    if (!shouldMinify) {
        return content;
    }

    return minify(content, {
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        keepClosingSlash: true,
    });
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const artifactPath = path.resolve(options.artifact);
    const artifactRaw = await readFile(artifactPath);

    const mime = options.mime ?? inferMime(artifactPath);

    let artifactPayload = artifactRaw;
    if (options.minifyHtml) {
        const minified = await maybeMinifyHtml(artifactRaw.toString("utf8"), true);
        artifactPayload = Buffer.from(minified, "utf8");
    }

    const dataUrlString = buildDataUrl(mime, artifactPayload);
    const dataUrl = ethers.hexlify(ethers.toUtf8Bytes(dataUrlString));

    const node = ethers.isHexString(options.name, 32)
        ? options.name
        : namehash(options.name);
    const functionSignature = "data(bytes32)";
    const functionCall = `data(${node})`;
    const returnType = "(bytes)";

    const target: EIP8121Target = {
        chainId: options.chainId,
        address: options.dataResolverAddress,
    };

    const hookData = await encodeHook(functionSignature, functionCall, returnType, target);
    const contenthashBytes = encodeEIP8121HookForContenthash(hookData);
    const contenthash = ethers.hexlify(contenthashBytes);

    const dataResolverInterface = new ethers.Interface(["function setData(bytes32 node, bytes value)"]);
    const setDataCalldata = dataResolverInterface.encodeFunctionData("setData", [
        node,
        ethers.toUtf8Bytes(dataUrl),
    ]);

    const resolverInterface = new ethers.Interface(["function setContenthash(bytes32 node, bytes hash)"]);
    const setContenthashCalldata = resolverInterface.encodeFunctionData("setContenthash", [
        node,
        contenthash,
    ]);

    const output: FullEncodeOutput = {
        name: options.name,
        node,
        dataUrl,
        dataUrlString,
        functionSignature,
        functionCall,
        hookData,
        contenthash,
        setDataCalldata,
        setContenthashCalldata,
        lengths: {
            artifactBytes: artifactPayload.length,
            dataUrlChars: dataUrlString.length,
            dataUrlBytes: ethers.getBytes(dataUrl).length,
            hookDataBytes: ethers.getBytes(hookData).length,
            contenthashBytes: ethers.getBytes(contenthash).length,
        },
    };

    if (options.out) {
        await writeFile(path.resolve(options.out), `${JSON.stringify(output, null, 2)}\n`, "utf8");
    }

    console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
    console.error("full-encode failed:", error instanceof Error ? error.message : error);
    process.exit(1);
});
