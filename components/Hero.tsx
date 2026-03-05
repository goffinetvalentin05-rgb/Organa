"use client";

import Header from "@/components/Header";
import Link from "next/link";

function HighlightedWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#60A5FA]">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 left-0 z-0 h-[0.7em] w-full translate-y-1 rotate-[-1.2deg]"
      >
        <path
          d="M5 34C31 22 60 16 97 16C136 16 167 22 205 33"
          stroke="#60A5FA"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.45"
        />
        <path
          d="M8 38C49 26 87 22 127 24C157 26 182 30 202 36"
          stroke="#2563EB"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.9"
        />
      </svg>
    </span>
  );
}

function CtaIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor">
        <path
          d="M7 17L17 7M17 7H9M17 7V15"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function MockupFrame() {
  return (
    <div id="apercu-plateforme" className="mx-auto mt-14 w-full max-w-5xl">
      <div className="rounded-[1.85rem] border border-slate-800/50 bg-[#030712] p-3 shadow-[0_35px_90px_rgba(2,6,23,0.28)] md:p-5">
        <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-gradient-to-br from-[#070E1F] via-[#0B1530] to-[#060C19]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/25 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden p-6 sm:min-h-[280px] md:min-h-[380px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.28),transparent_52%),radial-gradient(circle_at_80%_82%,rgba(59,130,246,0.24),transparent_58%)]" />
            <div className="relative rounded-2xl border border-white/20 bg-white/5 px-8 py-6 text-center backdrop-blur-sm">
              <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Obillz</p>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">Aperçu de la plateforme</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <>
      <Header />

      <section
        id="hero-obillz"
        className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#1A23FF_0%,#1B2CF0_60%,#1A2BE6_100%)] px-4 pb-10 pt-10 text-white sm:px-8 md:pb-16 md:pt-16"
      >
        <div className="pointer-events-none absolute -left-44 -top-24 h-[27rem] w-[27rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18),rgba(59,130,246,0)_68%)] blur-2xl" />
        <div className="pointer-events-none absolute -right-40 top-44 h-[25rem] w-[25rem] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),rgba(37,99,235,0)_68%)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-10 left-1/2 h-56 w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.35),rgba(147,197,253,0)_70%)] blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mx-auto mt-8 max-w-5xl text-balance text-[2rem] font-extrabold leading-[1.03] tracking-[-0.03em] sm:text-5xl md:text-6xl lg:text-[4.1rem]">
              La plateforme pour club sportif
              <br className="hidden sm:block" />
              {" "}qui <HighlightedWord>simplifie</HighlightedWord> votre comité.
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
              Gérez membres, cotisations, événements, bénévoles, buvette et finances depuis une
              seule plateforme.
            </p>

            <div className="mt-10">
              <Link
                href="/inscription"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-base font-semibold text-white shadow-[0_18px_35px_rgba(37,99,235,0.38)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(37,99,235,0.44)] sm:w-auto"
              >
                <span>Démarrer gratuitement</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <CtaIcon />
                </span>
              </Link>
              <p className="mt-3 text-sm text-slate-400">Sans engagement, aucune CB requise</p>
            </div>
          </div>

          <MockupFrame />
        </div>
      </section>
    </>
  );
}
