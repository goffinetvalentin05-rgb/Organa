import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration Turbopack pour résoudre le warning de root
  turbopack: {
    root: process.cwd(),
  },
  // Configuration des images pour permettre l'affichage des logos depuis Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
