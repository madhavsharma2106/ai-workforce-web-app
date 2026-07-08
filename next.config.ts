import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensures role definitions (read via fs at request/job time — see
  // src/lib/roles.ts) are bundled into the production server trace, since
  // Next can't statically see the runtime fs.readFileSync path.
  outputFileTracingIncludes: {
    "/*": ["./roles/**/*.md"],
  },
};

export default nextConfig;
