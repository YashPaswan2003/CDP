/** @type {import('next').NextConfig} */

const isCloudflare = process.env.BUILD_TARGET === 'cloudflare';

const nextConfig = {
  reactStrictMode: true,
  ...(isCloudflare
    ? {
        output: 'export',
        trailingSlash: true,
      }
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
            },
          ];
        },
        headers: async () => [
          {
            source: '/api/:path*',
            headers: [
              { key: 'Access-Control-Allow-Credentials', value: 'true' },
              { key: 'Access-Control-Allow-Origin', value: '*' },
              { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
              { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
            ],
          },
        ],
      }),
};

module.exports = nextConfig;
