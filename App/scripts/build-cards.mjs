// `npm run gen`: regenerate the consolidated card set from the local per-leaf
// source files and refresh the app's served copy.
//
//   1. run python build_all_cards.py  (writes <source>/all_cards.json)
//   2. copy that into App/public/all_cards.json  (what the app actually serves)
//
// The per-leaf source files and the Python script are local-only (not shipped
// in the repo). On a checkout without them, this is a no-op with a clear note.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_ROOT = path.resolve(__dirname, "..", "..", "card_source");
const SRC_ALL = path.join(CARDS_ROOT, "all_cards.json");
const BUILD_SCRIPT = path.resolve(CARDS_ROOT, "..", "python", "build_all_cards.py");
const PUBLIC_ALL = path.resolve(__dirname, "..", "public", "all_cards.json");

if (!fs.existsSync(BUILD_SCRIPT)) {
  console.log(
    "[gen] No local card source found — the app uses the prebuilt public/all_cards.json. Nothing to do."
  );
  process.exit(0);
}

let built = false;
for (const py of ["python", "py", "python3"]) {
  const r = spawnSync(py, [BUILD_SCRIPT], { stdio: "inherit" });
  if (r.error && r.error.code === "ENOENT") continue;
  if (r.status === 0) {
    built = true;
    break;
  }
  console.error("[gen] build script failed.");
  process.exit(r.status || 1);
}
if (!built) {
  console.error("[gen] Python not found. Install Python 3 to regenerate cards.");
  process.exit(1);
}

fs.copyFileSync(SRC_ALL, PUBLIC_ALL);
console.log(`[gen] Updated ${path.relative(path.resolve(__dirname, ".."), PUBLIC_ALL)}`);
