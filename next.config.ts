import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "5000" },
      { protocol: "https", hostname: "northhorr.s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "northhorr.s3.ap-south-1.amazonaws.com", pathname: "/news/**" },
      { protocol: "https", hostname: "northhorr.s3.ap-south-1.amazonaws.com", pathname: "/resources/**" },
      { protocol: "https", hostname: "northhorr.s3.ap-south-1.amazonaws.com", pathname: "/documents/**" },
    ],
  },
};

export default nextConfig;
