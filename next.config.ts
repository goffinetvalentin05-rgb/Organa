import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration Turbopack pour résoudre le warning de root
  turbopack: {
    root: process.cwd(),
  },
  // PDFKit charge ses métriques de polices (.afm) depuis le disque à l'exécution.
  // Le laisser hors du bundle serveur évite que ces fichiers soient perdus au
  // build, ce qui casserait la génération de la QR-facture en production.
  serverExternalPackages: ["pdfkit", "swissqrbill"],
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
