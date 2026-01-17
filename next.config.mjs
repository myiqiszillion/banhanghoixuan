/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      "pg-native": "commonjs pg-native",
      "pg": "commonjs pg",
    });
    return config;
  },
};

export default nextConfig;
