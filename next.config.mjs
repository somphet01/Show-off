/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    proxyClientMaxBodySize: 80 * 1024 * 1024,
  },
};

export default nextConfig;
