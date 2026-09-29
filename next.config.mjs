/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep build memory low on constrained machines and CI runners.
    cpus: 1,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.store.link' },
    ],
  },
};

export default nextConfig;
