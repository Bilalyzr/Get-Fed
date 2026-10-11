// Installs the versioned git hooks into .git/hooks (idempotent).
import { copyFileSync, mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hooksDir = join(root, ".git", "hooks");
mkdirSync(hooksDir, { recursive: true });
copyFileSync(join(root, "scripts", "git-hooks", "pre-push"), join(hooksDir, "pre-push"));
chmodSync(join(hooksDir, "pre-push"), 0o755);
console.log("installed .git/hooks/pre-push ✔");
