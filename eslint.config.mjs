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
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    "public/sw.js",
  ]),
  {
    files: ["src/app/**/*.tsx"],
    rules: {
      // Server Components catch failed data reads and render a message.
      // The JSX is built only after the await succeeds.
      "react-hooks/error-boundaries": "off",
    },
  },
]);

export default eslintConfig;
