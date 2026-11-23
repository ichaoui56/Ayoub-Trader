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
      { source: "/activities/:path*", destination: "/vip/login", permanent: false },
      { source: "/activity-reservations/:path*", destination: "/vip/login", permanent: false },
      { source: "/blog/:path*", destination: "/vip/login", permanent: false },
      { source: "/blogs/:path*", destination: "/vip/login", permanent: false },
      { source: "/coaching/:path*", destination: "/vip/login", permanent: false },
      { source: "/copy-trading/:path*", destination: "/vip/login", permanent: false },
      { source: "/private-rooms/:path*", destination: "/vip/login", permanent: false },
      { source: "/dashboard/login", destination: "/vip/login", permanent: true },
      { source: "/dashboard/loginP", destination: "/vip/login", permanent: true },
      { source: "/dashboard/transfers/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/requests/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/activities/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/activity-reservations/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/concierge/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/blogs/:path*", destination: "/dashboard", permanent: false },
      { source: "/dashboard/seo/:path*", destination: "/dashboard", permanent: false },
      { source: "/vip/dashboard/:path*", destination: "/app", permanent: false },
      { source: "/vip/dashboard", destination: "/app", permanent: false },
    ];
  },
};

export default nextConfig;
