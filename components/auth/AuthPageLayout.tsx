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
      {/* Ambiance immersive — grille + lueurs (esprit hero Obillz) */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(96,165,250,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.11) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 90% 70% at 50% 40%, black 10%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 70% at 50% 40%, black 10%, transparent 72%)",
          }}
        />
        <div className="absolute -left-[20%] top-[-10%] h-[55vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.35),transparent_68%)] blur-3xl" />
        <div className="absolute -right-[15%] bottom-[-5%] h-[50vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse,rgba(56,189,248,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute left-1/2 top-[12%] h-40 w-[min(70vw,520px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.28),transparent_70%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
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
