import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  sourcemap: true,
  // Bundle EVERYTHING including workspace deps (self-contained runner)
  noExternal: [/.*/],
});
