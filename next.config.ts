import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Self-hosted on a 1 GiB droplet behind Caddy. `standalone` traces the server
  // and only the dependencies it actually imports, so a release is ~100 MB
  // instead of a full node_modules tree, and the host needs no npm install.
  // This is not a static export: the API routes still run on a Node server.
  output: 'standalone',
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  async redirects() { return [{ source: '/dashboard', destination: '/', permanent: false }]; },
};
export default nextConfig;
