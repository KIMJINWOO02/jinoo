/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      path: false,
      crypto: false,
      stream: false,
      zlib: false,
      http: false,
      https: false,
      os: false,
      url: false
    };
    return config;
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  experimental: {
    esmExternals: true
  }
};

module.exports = nextConfig;
