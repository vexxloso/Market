import { rmSync, existsSync } from "node:fs";
import { join, normalize, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Paths Next may use for output; keeps Windows dev sane when switching NEXT_DIST_DIR. */
function dirsToClean() {
  const list = [join(root, ".next"), join(root, ".next-local")];
  const envDist = process.env.NEXT_DIST_DIR?.trim();
  if (envDist) {
    const resolved = isAbsolute(envDist) ? normalize(envDist) : join(root, normalize(envDist));
    if (!list.includes(resolved)) list.push(resolved);
  }
  return list;
}

let removed = false;
for (const dir of dirsToClean()) {
  if (!existsSync(dir)) continue;
  try {
    rmSync(dir, { recursive: true, force: true });
    console.log("Removed", dir);
    removed = true;
  } catch (err) {
    console.error(
      "Could not delete (files are locked). Stop every `npm run dev` / Node process for this app,",
    );
    console.error("close Cursor/IDE terminals running the server, then run this script again.");
    console.error(String(err?.message || err));
    process.exit(1);
  }
}

if (!removed) {
  console.log("No .next / alternate dist folders to remove");
}
