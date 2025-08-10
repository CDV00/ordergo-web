// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// const eslintConfig = [
//   ...compat.extends("next/core-web-vitals", "next/typescript"),
// ];

// export default eslintConfig;

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import eslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import noFloatingPromise from "eslint-plugin-no-floating-promise";
import unusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const config = [
  ...compat.extends("eslint:recommended", "next"),
  {
    plugins: {
      "unused-imports": unusedImports,
      "no-floating-promise": noFloatingPromise,
      "@typescript-eslint": eslintPlugin,
    },

    languageOptions: {
      globals: {
        React: "readonly",
        JSX: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
        "use client": "readonly",
      },
      parser: tsParser,
      parserOptions: {
        project: path.resolve(__dirname, "tsconfig.json"),
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // TODO: Enable these rules one by one and fix the errors.
      // Steps to enable a rule:
      // 1. Enable the rule by removing the "off" or "warn"
      // 2. Run `yarn lint --quiet` to see the errors.
      // 3. Fix the errors by following the ESLint rules.
      "no-extra-boolean-cast": "off",
      "no-unused-vars": "off",
      "no-empty-pattern": "off",
      "no-useless-escape": "off",
      "no-fallthrough": "off",
      "no-constant-binary-expression": "off",
      "no-useless-catch": "off",
      "no-prototype-builtins": "off",
      "no-unreachable": "off",
      "no-async-promise-executor": "off",
      "no-empty": "off",
      "no-dupe-else-if": "error",
      "no-unsafe-optional-chaining": "off",
      "no-case-declarations": "off",
      "no-undef": "off",
      "no-constant-condition": "off",
      "no-self-assign": "error",

      "react-hooks/exhaustive-deps": "error",

      "unused-imports/no-unused-imports": ["warn"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
          args: "none",
        },
      ],

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
];

export default config;
