/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
    };
    if (isServer) {
      config.externals.push(
        'pino-pretty',
        'lokijs',
        'encoding',
        '@react-native-async-storage/async-storage',
      );
    }
    return config;
  },
};

export default nextConfig;
