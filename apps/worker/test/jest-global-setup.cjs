const { execSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function globalSetup() {
  const dbFile = path.join(__dirname, "..", "integration.test.db");
  const databaseUrl = `file:${dbFile}`;

  process.env.DATABASE_URL = databaseUrl;

  const databasePkg = path.join(__dirname, "..", "..", "..", "packages", "database");

  execSync("pnpm exec prisma migrate deploy --schema=prisma/schema.prisma", {
    cwd: databasePkg,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
};
