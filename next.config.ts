import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  async redirects() { return [{ source: '/dashboard', destination: '/', permanent: false }]; },
};
export default nextConfig;
