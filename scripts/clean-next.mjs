import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = join(root, ".next");

if (!existsSync(nextDir)) {
  console.log("No .next folder to remove");
  process.exit(0);
}

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next");
} catch (err) {
  console.error(
    "Could not delete .next (files are locked). Stop every `npm run dev` / Node process for this app,",
  );
  console.error("close Cursor/IDE terminals running the server, then run this script again.");
  console.error(String(err?.message || err));
  process.exit(1);
}
