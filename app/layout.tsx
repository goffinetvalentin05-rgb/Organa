import "./globals.css";
import type { Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1a1a1f",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
        <div id="obillz-portal-root" className="fixed inset-0 z-[9999] pointer-events-none" />
      </body>
    </html>
  );
}
