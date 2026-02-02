/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@schoolerp/ui"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
