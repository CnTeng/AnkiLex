import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import { build } from "vite";
import type { Target } from "../src/manifests/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolve = (p: string) => path.resolve(__dirname, p);

async function runVite(mode: string) {
  await build({
    logLevel: "warn",
    mode,
  });
}

const runBuild = async (target: Target) => {
  const start = Date.now();
  console.info(`🛠️ Building: ${target}...`);

  if (target === "zotero") {
    await runVite("zotero");
  } else {
    await runVite(`${target}:app`);
    await runVite(`${target}:content`);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.info(`✅ Done: ${target} built in ${duration}s`);
};

interface PackageJson {
  name: string;
  version: string;
}

const runPackage = async (target: Target, pkg: PackageJson) => {
  const start = Date.now();

  const { name, version } = pkg;
  const ext = target === "chrome" ? "zip" : "xpi";
  const outputName = `${name}-${target}-v${version}.${ext}`;
  const outPath = resolve(`../dist/${outputName}`);

  const zip = new AdmZip();
  zip.addLocalFolder(resolve(`../dist/${target}`));
  zip.writeZip(outPath);

  const stats = await fs.stat(outPath);
  const size = (stats.size / 1024 / 1024).toFixed(2);
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  console.info(`📦 Package: ${outputName} (${size} MB) in ${duration}s`);
};

const main = async () => {
  const pkg = JSON.parse(await fs.readFile(resolve("../package.json"), "utf8"));
  const target = process.argv[2] as Target;
  const shouldPackage = process.argv.includes("--package");

  try {
    await runBuild(target);
    if (shouldPackage) {
      await runPackage(target, pkg);
    }
  } catch (err) {
    console.error(`\n 🛑 FAILED  ${target}:`, err);
    process.exit(1);
  }
};

main();
