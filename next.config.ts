import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone' as const,
  reactStrictMode: true,
  compress: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', '@phosphor-icons/react'],
  },
  images: {
    domains: ['goipmracccjxjmhpizib.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'goipmracccjxjmhpizib.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    config.stats = 'verbose';
    config.cache = false;
    return config;
  }
};

export default withNextIntl(nextConfig);