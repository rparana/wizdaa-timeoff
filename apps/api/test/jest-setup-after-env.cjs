const path = require("node:path");

const dbFile = path.join(__dirname, "..", "integration.test.db");
process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${dbFile}`;
process.env.HCM_MOCK_URL = process.env.HCM_MOCK_URL || "http://127.0.0.1:9";
