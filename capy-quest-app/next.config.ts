/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        port: '',
        pathname: '/ipfs/**',
      }
    ],
  },
  // Configuración adicional para evitar errores de hidratación
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig