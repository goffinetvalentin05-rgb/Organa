"use client";

function HighlightedWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#2563EB]">
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
    <div className="mx-auto mt-12 w-full max-w-5xl">
      <div className="rounded-[1.85rem] border border-slate-800/60 bg-[#030712] p-3 shadow-[0_35px_90px_rgba(2,6,23,0.35)] md:p-5">
        <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#050D1F]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/25 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden p-6 sm:min-h-[280px] md:min-h-[380px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.28),transparent_52%),radial-gradient(circle_at_80%_82%,rgba(59,130,246,0.24),transparent_58%)]" />
            <div className="relative rounded-2xl border border-white/20 bg-white/5 px-8 py-6 text-center backdrop-blur-sm">
              <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Obillz</p>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">Apercu Obillz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-white px-4 pb-8 pt-6 text-slate-950 sm:px-8 md:px-12 md:pb-12 md:pt-10">
      <div className="pointer-events-none absolute -left-28 top-6 h-64 w-64 rounded-full bg-blue-100/75 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-blue-100/55 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-4 py-2 text-xs font-semibold text-blue-900 shadow-[0_8px_20px_rgba(37,99,235,0.1)] sm:text-sm">
          <span className="inline-flex -space-x-1">
            <span className="h-5 w-5 rounded-full border border-white bg-blue-300" />
            <span className="h-5 w-5 rounded-full border border-white bg-blue-400" />
            <span className="h-5 w-5 rounded-full border border-white bg-blue-500" />
          </span>
          <span>+120 clubs utilisent Obillz au quotidien</span>
        </div>

        <h1 className="mx-auto mt-7 max-w-5xl text-balance text-[2.2rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-5xl md:text-6xl lg:text-[4.2rem]">
          La plateforme pour club sportif qui <HighlightedWord>simplifie</HighlightedWord> votre
          comite.
        </h1>

        <p className="mx-auto mt-7 max-w-3xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
          Gerez membres, cotisations, evenements, benevoles, buvette et finances depuis une seule
          plateforme. Passez moins de temps a gerer et plus de temps a faire vivre votre club.
        </p>

        <div className="mt-10">
          <button
            type="button"
            className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-4 text-base font-semibold text-white shadow-[0_18px_35px_rgba(37,99,235,0.38)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(37,99,235,0.44)] sm:w-auto"
          >
            <span>Demarrer gratuitement</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              <CtaIcon />
            </span>
          </button>
          <p className="mt-3 text-sm text-slate-500">Sans engagement, aucune CB requise</p>
        </div>
      </div>

      <MockupFrame />
    </section>
  );
}
