import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "index.ts",
    "brief-parser/index": "brief-parser/index.ts",
    "matcher/index": "matcher/index.ts",
    "agentic-search/index": "agentic-search/index.ts",
  },
  format: ["cjs", "esm"],
  dts: false, // Disabled due to type inference issues with AI SDK provider types
  splitting: false,
  sourcemap: true,
  clean: true,
});
