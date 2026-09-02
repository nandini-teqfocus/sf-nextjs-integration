/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.salesforce.com https://*.force.com https://*.my.site.com http://localhost:3000;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
