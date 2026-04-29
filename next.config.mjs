/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude puppeteer from serverless bundles — it's only used for
  // PDF export which requires a Node.js-capable runtime (not edge).
  experimental: {
    serverComponentsExternalPackages: ["puppeteer"],
  },
  // Vercel-specific: Increase serverless function timeout for export routes
  serverExternalPackages: ["puppeteer"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
