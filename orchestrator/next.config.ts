import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; it must not be bundled.
  serverExternalPackages: ["better-sqlite3"],
  // The orchestrator lives beside an unrelated app in this repository, so the
  // tracing root is pinned rather than inferred from the nearest lockfile.
  outputFileTracingRoot: path.join(import.meta.dirname, "."),
  // The floating dev badge overlaps the rail's footer; the app has its own
  // status affordances and does not need it.
  devIndicators: false,
};

export default nextConfig;
