/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.20.10.4'],

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
