const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Dynamic routes [id] require generateStaticParams for static export
  trailingSlash: true,
  transpilePackages: ["@schoolerp/ui"],
};

module.exports = withNextIntl(nextConfig);
