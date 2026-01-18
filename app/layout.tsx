import "./globals.css";
import Image from "next/image";
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
  title: "Organa",
  description: "La gestion simple pour les indépendants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-body min-h-screen text-white app-bg">
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
      </body>
    </html>
  );
}
