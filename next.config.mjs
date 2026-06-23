/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Canonical URLs, sitemap entries, and all internal <Link>s use trailing
  // slashes; serve them directly (200) instead of 308-redirecting, so the
  // served URL matches the declared rel=canonical.
  trailingSlash: true,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com"
      }
    ]
  },
  async redirects() {
    return [
      {
        source: "/sports",
        destination: "/sports-previews/",
        permanent: true
      },
      {
        source: "/sports/:path*",
        destination: "/sports-previews/",
        permanent: true
      },
      {
        source: "/video",
        destination: "/sports-previews/",
        permanent: true
      },
      {
        source: "/videos",
        destination: "/sports-previews/",
        permanent: true
      },
      {
        source: "/video/cox7-advertiser/:path*",
        destination: "/archive/local-video/",
        permanent: true
      },
      {
        source: "/schedule",
        destination: "/upcoming-live-sports/",
        permanent: true
      },
      {
        source: "/shows",
        destination: "/channels/",
        permanent: true
      },
      {
        source: "/events",
        destination: "/upcoming-live-sports/",
        permanent: true
      },
      {
        source: "/stem-journals/:path*",
        destination: "/archive/stem-journals/",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
