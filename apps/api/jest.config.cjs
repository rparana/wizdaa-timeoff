/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.spec.ts", "<rootDir>/src/**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@worker/(.*)$": "<rootDir>/../worker/src/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.spec.json" },
    ],
  },
  globalSetup: "<rootDir>/test/jest-global-setup.cjs",
  setupFilesAfterEnv: ["<rootDir>/test/jest-setup-after-env.cjs"],
  testTimeout: 60_000,
  maxWorkers: 1,
  collectCoverageFrom: [
    "src/domain/**/*.ts",
    "src/application/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/domain/**/*.repository.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
