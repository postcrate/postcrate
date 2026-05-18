import js from "@eslint/js";
import tseslint from "typescript-eslint";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "src-tauri",
      "public",
      // tauri-specta auto-generates this; we don't lint generated code.
      "src/lib/bridge/bindings.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { perfectionist },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "line-length",
          order: "asc",
        },
      ],
    },
  },
);
