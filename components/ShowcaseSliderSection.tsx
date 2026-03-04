"use client";

import Link from "next/link";
import { useRef } from "react";

type SlideCard = {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
};

function HighlightWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#60A5FA]">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 left-0 z-0 h-[0.56em] w-full"
      >
        <path
          d="M6 35C46 22 83 18 121 21C152 23 179 28 203 34"
          stroke="#93C5FD"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.5"
        />
        <path
          d="M8 39C44 28 83 25 125 28C155 30 180 34 201 38"
          stroke="#60A5FA"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

function SliderCard({ card }: { card: SlideCard }) {
  return (
    <article className="min-h-[355px] min-w-[330px] snap-start rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#050A17_0%,#0A1734_58%,#071127_100%)] p-5 shadow-[0_20px_50px_rgba(2,8,23,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(2,8,23,0.55)] md:min-h-[380px] md:min-w-[390px] md:p-6">
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
        <p className="text-xs font-medium text-slate-300">{card.subtitle}</p>
        <h3 className="mt-1 text-base font-semibold text-white">{card.title}</h3>
      </div>
      <div className="mt-4 h-[calc(100%-78px)]">{card.content}</div>
    </article>
  );
}

export default function ShowcaseSliderSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (direction: "left" | "right") => {
    if (!trackRef.current) return;
    const amount = Math.max(trackRef.current.clientWidth * 0.72, 340);
    trackRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const cards: SlideCard[] = [
    {
      id: "stats",
      title: "Statistiques du club",
      subtitle: "Vue d'ensemble en temps réel",
      content: (
        <div className="grid gap-3">
          {[
            { label: "Nombre de membres", value: "284" },
            { label: "Cotisations encaissées", value: "42 650 CHF" },
            { label: "Revenus événements", value: "18 940 CHF" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-slate-300">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "cotisations",
      title: "Évolution des cotisations",
      subtitle: "Progression mensuelle",
      content: (
        <div className="h-full rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="relative h-full overflow-hidden rounded-lg border border-white/5 bg-[#081126] p-3">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:22px_22px]" />
            <svg viewBox="0 0 320 150" className="relative mt-4 w-full">
              <path
                d="M0 130 C 40 118, 60 90, 90 95 C 120 100, 130 70, 165 73 C 200 76, 220 35, 250 46 C 280 56, 300 24, 320 22"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      ),
    },
    {
      id: "membres",
      title: "Gestion des membres",
      subtitle: "Interface centralisée Obillz",
      content: (
        <div className="grid h-full grid-cols-[120px_1fr] overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <aside className="border-r border-white/10 bg-[#0C1A3A] p-2.5">
            {["Dashboard", "Membres", "Cotisations", "Événements", "Buvette", "Finances"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`mb-1 rounded-lg px-2 py-1.5 text-[11px] ${
                    index === 0 ? "bg-[#2563EB] text-white" : "text-slate-300"
                  }`}
                >
                  {item}
                </div>
              ),
            )}
          </aside>
          <div className="p-3">
            <p className="text-xs text-slate-300">Membres actifs</p>
            <p className="mt-1 text-lg font-semibold text-white">+34 cette saison</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="h-14 rounded-lg bg-white/5" />
              <div className="h-14 rounded-lg bg-white/5" />
              <div className="col-span-2 h-20 rounded-lg bg-white/5" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "events",
      title: "Organisation des événements",
      subtitle: "Planning équipe et bénévoles",
      content: (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-slate-300">
            {["L", "M", "M", "J", "V", "S", "D"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`h-8 rounded-md ${
                  [5, 11, 18, 20, 26].includes(i) ? "bg-blue-500/30" : "bg-white/5"
                }`}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "qrcode",
      title: "QR codes d'inscription",
      subtitle: "Lien rapide pour vos événements",
      content: (
        <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="rounded-xl border border-white/15 bg-white p-4 shadow-lg">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 49 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 ${
                    (i + Math.floor(i / 7)) % 3 === 0 ? "bg-slate-900" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="mx-auto mt-20 w-full max-w-[1200px]">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] text-white md:text-[3.15rem]">
            Simplifie ton <HighlightWord>quotidien</HighlightWord>, tout
            <br className="hidden md:block" /> en restant aux commandes.
          </h2>
          <Link
            href="/inscription"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.45)] transition hover:-translate-y-0.5"
          >
            Démarrer gratuitement
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Carte précédente"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor">
              <path
                d="M15 18L9 12L15 6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Carte suivante"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor">
              <path
                d="M9 6L15 12L9 18"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <SliderCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
