import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "backups/**",
    ".kilo/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: ["tests/**/*.test.ts", "tests/**/*.spec.ts", "scripts/**/*.js", "lib/**/*.test.ts", "lib/**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["app/api/**/*.js", "app/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
