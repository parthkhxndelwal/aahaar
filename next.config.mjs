/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow network access from different origins
  experimental: {
    allowedDevOrigins: ['192.168.56.1', '192.168.1.2', '127.0.0.1', 'localhost'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add mysql2 as an external dependency for server-side rendering
      config.externals.push('mysql2');
    }
    return config;
  },
  serverExternalPackages: [
    'sequelize',
    'mysql2'
  ],
}

export default nextConfig
