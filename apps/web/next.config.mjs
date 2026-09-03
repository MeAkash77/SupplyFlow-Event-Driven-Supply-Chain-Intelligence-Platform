/** @type {import('next').NextConfig} */
const apiOrigin = process.env.EASYFLOW_API_URL ?? "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  // Next.js 14: keep better-auth (and its Node-only deps like kysely/sqlite)
  // out of the webpack bundle so they run only in the Node runtime.
  experimental: {
    serverComponentsExternalPackages: [
      "better-auth",
      "@better-auth/core",
      "@better-auth/kysely-adapter",
      "@better-auth/memory-adapter",
      "kysely",
      "@anthropic-ai/sdk",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/connectors",
        destination: `${apiOrigin}/api/connectors`,
      },
      {
        source: "/api/tenants/:path*",
        destination: `${apiOrigin}/api/tenants/:path*`,
      },
      {
        source: "/api/webhooks/:path*",
        destination: `${apiOrigin}/api/webhooks/:path*`,
      },
    ];
  },
};

export default nextConfig;
