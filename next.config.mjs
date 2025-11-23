/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.afm$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
