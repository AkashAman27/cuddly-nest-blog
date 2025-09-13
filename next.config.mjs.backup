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
    domains: ['img.youtube.com'],
  },
  webpack: (config, { isServer }) => {
    // Handle lingo.dev SDK which contains Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        'node:net': false,
        'node:tls': false,
        'node:fs': false,
        'node:child_process': false,
      }
    }

    // Note: Removed externals configuration as it was interfering with Supabase

    return config
  },
  // Note: serverComponentsExternalPackages is handled by webpack config above
}

export default nextConfig
