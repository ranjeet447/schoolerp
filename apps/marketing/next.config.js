/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@schoolerp/ui"],
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
