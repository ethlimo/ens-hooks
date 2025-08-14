import { readFile } from "fs/promises";
import { minify } from "html-minifier-terser";
import { dirname, resolve } from "path/posix";
import { fileURLToPath } from "url";

export async function getBase64Payload() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = resolve(__dirname, "index.html");
    const fileContent = await readFile(filePath, "utf8");
    const minified = await minify(fileContent, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
    });
    const base64 = Buffer.from(minified).toString("base64");
    const mimeType = "text/html";
    return `data:${mimeType};base64,${base64}`;
}
