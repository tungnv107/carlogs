/** @type {import('next').NextConfig} */
const nextConfig = {
  // On OneDrive-synced Windows paths, tracing/copying standalone output can
  // fail with EPERM. Production Docker builds still use standalone by default.
  ...(process.env.NEXT_BUILD_SKIP_STANDALONE === "1" ? {} : { output: "standalone" }),
  // Keep next dev out of .next, which is used by production builds. On synced
  // Windows drives the two processes can otherwise leave dev without its
  // routes-manifest.json. NEXT_BUILD_DIR still overrides both when supplied.
  distDir: process.env.NEXT_BUILD_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  reactStrictMode: true,
  devIndicators: false,
  // Resolve project-local @/ imports in both the server and client bundles.
  // Some Windows cloud-synced workspaces do not pick up tsconfig paths during
  // the production webpack pass even though TypeScript resolves them.
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, "@": process.cwd() };
    return config;
  },
  // The receipt limit is 5 MiB. Multipart overhead needs additional room.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
