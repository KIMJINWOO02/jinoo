/** @type {import('next').NextConfig} */
const nextConfig = {
  // 캐시 방지 설정
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  
  // API 경로 리다이렉션
  async rewrites() {
    return [
      {
        source: '/api/generate-image',
        destination: '/api/generate',
      },
    ];
  },
  
  // 캐시 제어 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 최적화 설정
  images: {
    // 허용할 이미지 호스트 도메인
    domains: [
      'oaidalleapiprodscus.blob.core.windows.net', // OpenAI DALL-E
      'replicate.delivery',
      'pbxt.replicate.delivery',
    ],
    // 외부 이미지 소스 패턴
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // 이미지 포맷 및 크기 최적화
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  
  // 환경 변수 설정
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  
  // 웹팩 설정
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        dgram: false,
        module: false,
      };
    }
    return config;
  },
  
  // API 요청 크기 제한 설정 (Next.js 13+에서는 route.js에서 직접 설정)
  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

// 개발 환경 로깅
if (process.env.NODE_ENV !== 'production') {
  console.log('Next.js Config Loaded');
}

module.exports = nextConfig;
