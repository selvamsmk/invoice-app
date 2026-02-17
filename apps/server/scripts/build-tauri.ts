import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "../../..");
const serverSrc = path.join(root, "apps/server/src/index.ts");
const outDir = path.join(root, "apps/desktop/src-tauri/bin");

// ensure bin dir exists
fs.mkdirSync(outDir, { recursive: true });

// get target triple
const target = execSync("rustc --print host-tuple")
  .toString()
  .trim();

if (!target) {
  console.error("❌ Failed to determine Rust target triple");
  process.exit(1);
}

const extension = process.platform === "win32" ? ".exe" : "";
const outFile = `server-${target}${extension}`;
const outPath = path.join(outDir, outFile);

console.log(`📦 Building server sidecar for ${target}`);

execSync(
  `bun build --compile --minify --bytecode ${serverSrc} --outfile ${outPath}`,
  { stdio: "inherit" }
);

console.log(`✅ Sidecar built: ${outPath}`);

const migrationsSrc = path.join(root, "apps/server/migrations");
const resourcesDir = path.join(
  root,
  "apps/desktop/src-tauri/resources/migrations"
);

fs.rmSync(resourcesDir, { recursive: true, force: true });
fs.mkdirSync(resourcesDir, { recursive: true });
fs.cpSync(migrationsSrc, resourcesDir, { recursive: true });

console.log("📦 Migrations copied into Tauri resources");
