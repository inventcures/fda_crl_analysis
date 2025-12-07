/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },

  // Increase max file size for PDFs
  experimental: {
    largePageDataBytes: 128 * 1024, // 128KB
  },

  // Configure webpack to handle PDF files
  webpack: (config) => {
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    return config
  },
}

module.exports = nextConfig
