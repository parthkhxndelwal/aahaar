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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add mysql2 as an external dependency for server-side rendering
      config.externals.push('mysql2');
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'mysql2'],
  },
}

export default nextConfig
