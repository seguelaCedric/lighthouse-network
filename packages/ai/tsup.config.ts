import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "index.ts",
    "brief-parser/index": "brief-parser/index.ts",
    "matcher/index": "matcher/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
