import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)s?$": "@swc/jest",
  },
  coverageDirectory: "./coverage-e2e",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/(.+)/dto/(.+)",
    "<rootDir>/src/(.+)/(.+).module.ts",
    "<rootDir>/src/(.+).module.ts",
    "<rootDir>/src/main.ts",
    "<rootDir>/src/run.ts",
    "<rootDir>/src/config/",
    "<rootDir>/src/common/db/migrations/",
  ],
  modulePaths: ["<rootDir>", "<rootDir>/src"],
};

export default config;
