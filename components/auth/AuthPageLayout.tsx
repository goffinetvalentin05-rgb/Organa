"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { obillzLandingRootClass } from "@/components/ui/styles";

type AuthPageLayoutProps = {
  children: ReactNode;
};

export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className={obillzLandingRootClass}>
      {/* Fond auth aligné sur le footer de la landing */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 42% at 50% 45%, rgba(50,91,255,0.32), transparent 70%), radial-gradient(circle at 50% 85%, rgba(56,189,248,0.16) 0%, transparent 42%), linear-gradient(180deg, #071634 0%, #102d78 38%, #175dd4 68%, #37b9ed 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(96,165,250,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.14) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 100% 82% at 50% 58%, black 5%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 82% at 50% 58%, black 5%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817]"
          >
            <Image
              src="/obillz-logo.png"
              alt="Obillz"
              width={140}
              height={36}
              priority
              className="h-7 w-auto sm:h-8"
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-blue-100/55 transition hover:text-white sm:text-sm"
          >
            Accueil
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-6 sm:pb-14 lg:px-8">
          {children}
        </section>
      </div>
    </main>
  );
}
