import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async redirects() {
    return [
      { source: "/activities/:path*", destination: "/", permanent: true },
      { source: "/blog/:path*", destination: "/", permanent: true },
      { source: "/blogs/:path*", destination: "/", permanent: true },
      { source: "/dashboard/transfers/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/requests/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/activities/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/activity-reservations/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/concierge/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/blogs/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/seo/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/settings/:path*", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
