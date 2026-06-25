import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "html-minifier-terser";
import { ethers } from "ethers";

interface EncodeArtifactOptions {
    input: string;
    mime?: string;
    minifyHtml: boolean;
    out?: string;
}

function printUsage(): void {
    console.log(`Usage:\n  npm run encode-artifact -- --file <file> [options]\n\nOptions:\n  --file <file>         Artifact file path (required, alias: --input)\n  --mime <mime>         Override MIME type\n  --minify-html         Minify HTML before encoding\n  --out <file>          Write only data URL bytes hex (0x...) to file\n  --help                Show help\n\nOutput dataUrl is UTF-8 bytes hex (0x...) of a base64 data URL string.\n`);
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

function parseArgs(argv: string[]): EncodeArtifactOptions {
    const options: Partial<EncodeArtifactOptions> = {
        minifyHtml: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--help") {
            printUsage();
            process.exit(0);
        }

        if (arg === "--file") {
            options.input = argv[++i];
            continue;
        }

        if (arg === "--input") {
            options.input = argv[++i];
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

    if (!options.input) {
        throw new Error("Missing required --input argument.");
    }

    return options as EncodeArtifactOptions;
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

function buildDataUrl(mime: string, data: Buffer): string {
    return `data:${mime};base64,${data.toString("base64")}`;
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const inputPath = path.resolve(options.input);
    const original = await readFile(inputPath);

    const mime = options.mime ?? inferMime(inputPath);

    let payload = original;
    if (options.minifyHtml) {
        const maybeHtml = original.toString("utf8");
        const minified = await maybeMinifyHtml(maybeHtml, true);
        payload = Buffer.from(minified, "utf8");
    }

    const dataUrl = buildDataUrl(mime, payload);
    const dataUrlBytesHex = ethers.hexlify(ethers.toUtf8Bytes(dataUrl));

    if (options.out) {
        await writeFile(path.resolve(options.out), `${dataUrlBytesHex}\n`, "utf8");
    }

    console.log("Artifact encoding complete");
    console.log("Input:", inputPath);
    console.log("MIME:", mime);
    console.log("Mode:", "base64");
    console.log("Artifact bytes:", payload.length);
    console.log("Data URL length:", dataUrl.length);
    console.log("Data URL bytes length:", ethers.getBytes(dataUrlBytesHex).length);
    console.log("Data URL:", dataUrlBytesHex);
}

main().catch((error) => {
    console.error("encode-artifact failed:", error instanceof Error ? error.message : error);
    process.exit(1);
});
