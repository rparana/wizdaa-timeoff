#!/usr/bin/env node
/**
 * SQLite + Prisma: resolve DATABASE_URL to an absolute file path under this package
 * so `migrate deploy` / `migrate reset` / `db seed` behave consistently from any cwd.
 */
const path = require("path");
const { spawnSync } = require("child_process");

const pkgRoot = path.join(__dirname, "..");
const dbFile = path.join(pkgRoot, "dev.db");
process.env.DATABASE_URL = `file:${dbFile}`;

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error("Usage: node scripts/run-prisma-with-local-db.cjs <prisma-args...>");
  process.exit(1);
}

const r = spawnSync("pnpm", ["exec", "prisma", ...prismaArgs], {
  cwd: pkgRoot,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  shell: process.platform === "win32",
});

process.exit(r.status === null ? 1 : r.status);
