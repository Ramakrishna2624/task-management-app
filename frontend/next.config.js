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
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'https://task-management-backend-56j7.onrender.com/api',
  },
};

module.exports = nextConfig;
