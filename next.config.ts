import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // 사진은 S3, 프로필 이미지는 소셜 제공자(googleusercontent 등) — 호스트가 고정돼 있지 않아 https 전체 허용
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
