/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  },
  images: {
    domains: ['res.cloudinary.com', 'openweathermap.org'],
  },
};

module.exports = nextConfig;
