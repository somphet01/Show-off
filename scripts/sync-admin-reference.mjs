import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, ".admin-ui-reference", "dist");
const targetDir = join(root, "public", "admin-static");

if (!existsSync(distDir)) {
  throw new Error("Missing .admin-ui-reference/dist. Run the admin reference build first.");
}

let clearedTarget = false;
try {
  await rm(targetDir, { recursive: true, force: true });
  clearedTarget = true;
} catch (error) {
  console.warn(
    "Could not fully clear public/admin-static before syncing. Copying build output over the existing files instead.",
    error instanceof Error ? error.message : error,
  );
}
await mkdir(targetDir, { recursive: true });
await cp(
  distDir,
  targetDir,
  clearedTarget
    ? { recursive: true }
    : { recursive: true, force: false, errorOnExist: false },
);

const indexPath = join(targetDir, "index.html");
const dataScript = '<script src="/api/admin/reference-data"></script>';
let html = await readFile(indexPath, "utf8");
html = html.replace(dataScript, "");
html = html.replace(/(<script type="module"[^>]+><\/script>)/, `${dataScript}\n      $1`);
await writeFile(indexPath, html);

console.log("Synced admin reference UI to public/admin-static");
