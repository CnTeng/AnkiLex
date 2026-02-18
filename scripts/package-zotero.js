const AdmZip = require("adm-zip");
const path = require("node:path");
const fs = require("node:fs");

const distPath = path.resolve(__dirname, "../dist");
const zoteroDistPath = path.join(distPath, "zotero");
const outputPath = path.join(distPath, "ankilex-zotero.xpi");

if (!fs.existsSync(zoteroDistPath)) {
  console.error(
    `Error: Directory ${zoteroDistPath} does not exist. Run 'npm run build:zotero' first.`,
  );
  process.exit(1);
}

try {
  const zip = new AdmZip();
  // Add the contents of the zotero folder to the root of the zip
  zip.addLocalFolder(zoteroDistPath);
  zip.writeZip(outputPath);
  console.log(`Successfully created ${outputPath}`);
} catch (e) {
  console.error("Error creating zip file:", e);
  process.exit(1);
}
