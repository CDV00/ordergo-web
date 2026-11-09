// Chạy unit test logic offline không cần thêm dependency (không có jest/vitest/tsx trong web):
// biên dịch các file .ts thuần bằng `typescript` (devDependency sẵn có) ra thư mục tạm → `node --test`.
//   node src/lib/offline/__tests__/run.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const files = {
  "outbox-core.mjs": join(here, "..", "outbox-core.ts"),
  "outbox-core.test.mjs": join(here, "outbox-core.test.ts"),
};

const out = mkdtempSync(join(tmpdir(), "ordergo-offline-test-"));
try {
  for (const [name, src] of Object.entries(files)) {
    const { outputText } = ts.transpileModule(readFileSync(src, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: src,
    });
    writeFileSync(
      join(out, name),
      outputText.replaceAll('"../outbox-core"', '"./outbox-core.mjs"'),
    );
  }
  const res = spawnSync(process.execPath, ["--test", join(out, "outbox-core.test.mjs")], {
    stdio: "inherit",
  });
  process.exitCode = res.status ?? 1;
} finally {
  rmSync(out, { recursive: true, force: true });
}
