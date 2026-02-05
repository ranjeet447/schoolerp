const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@schoolerp/ui"],
};

module.exports = withNextIntl(nextConfig);
