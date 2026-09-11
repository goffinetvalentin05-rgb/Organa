import "./globals.css";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import ObillzToaster from "@/components/ObillzToaster";
import ObillzAnalytics from "@/components/ObillzAnalytics";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata = {
  title: "Obillz",
  description: "La gestion simple pour les clubs sportifs",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="font-body min-h-[100dvh] w-full text-white app-bg">
        {/* CONTENU DES PAGES */}
        {/* Note: Les pages gèrent leur propre structure HTML (balise <main> incluse) */}
        <I18nProvider>{children}</I18nProvider>
        <ObillzToaster />
        <div id="obillz-portal-root" className="fixed inset-0 z-[9999] pointer-events-none" />
        <ObillzAnalytics />
      </body>
    </html>
  );
}
