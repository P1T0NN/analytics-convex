import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const output = execSync("bun pm pack", { encoding: "utf8" });
const tarball = output
	.split("\n")
	.map((line) => line.trim())
	.find((line) => line.endsWith(".tgz"));

if (!tarball || !existsSync(tarball)) {
	throw new Error("Expected bun pm pack to produce a tarball.");
}

const entries = execSync(`tar -tzf "${tarball}"`, { encoding: "utf8" })
	.split("\n")
	.map((line) => line.replace(/\r$/, ""))
	.filter(Boolean);

const requiredPaths = [
	"package/package.json",
	"package/dist/client/index.js",
	"package/dist/client/index.d.ts",
	"package/dist/testing/index.js",
	"package/dist/testing/index.d.ts",
	"package/dist/component/convex.config.js",
];

for (const relativePath of requiredPaths) {
	if (!entries.includes(relativePath)) {
		throw new Error(`Missing packed file: ${relativePath}`);
	}
}

const packageJson = JSON.parse(
	execSync(`tar -xOf "${tarball}" package/package.json`, { encoding: "utf8" }),
);

if (!packageJson.exports?.["./testing"]) {
	throw new Error("Packed package.json is missing ./testing export.");
}

console.log(`Pack verify passed for ${tarball}`);
