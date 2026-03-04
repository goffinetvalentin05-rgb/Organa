"use client";

import { useState } from "react";

type ComparisonMode = "without" | "with";

const comparisonContent = {
  without: {
    subtitle: "Une gestion dispersée et chronophage",
    bullets: [
      "Informations dispersées entre Excel, WhatsApp et papiers",
      "Cotisations à relancer manuellement",
      "Difficulté à suivre les membres et bénévoles",
      "Organisation des événements compliquée",
      "Perte de temps sur des tâches répétitives",
      "Manque de visibilité sur les finances du club",
    ],
  },
  with: {
    subtitle: "Toute l'organisation du club au même endroit",
    bullets: [
      "Membres et équipes centralisés",
      "Cotisations envoyées automatiquement",
      "Organisation simple des événements et bénévoles",
      "Suivi clair des finances et des revenus",
      "Communication facilitée avec les membres",
      "Gain de temps énorme pour le comité",
    ],
  },
} as const;

function HighlightWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#2563EB]">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 left-0 z-0 h-[0.55em] w-full"
      >
        <path
          d="M6 35C46 22 83 18 121 21C152 23 179 28 203 34"
          stroke="#60A5FA"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.4"
        />
        <path
          d="M8 39C44 28 83 25 125 28C155 30 180 34 201 38"
          stroke="#2563EB"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

function WithoutObillzMockup({ active }: { active: boolean }) {
  const items = [
    {
      title: "Excel",
      description: "Listes membres et suivis épars dans plusieurs fichiers.",
      icon: "X",
    },
    {
      title: "Gestion manuelle des paiements",
      description: "Relances et vérification des cotisations à la main.",
      icon: "$",
    },
    {
      title: "Messages WhatsApp des joueurs",
      description: "Informations perdues entre les conversations.",
      icon: "W",
    },
    {
      title: "Organisation des événements à la main",
      description: "Bénévoles et planning gérés sans outil central.",
      icon: "C",
    },
  ];

  return (
    <div
      className={`absolute inset-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg transition-all duration-500 md:p-6 ${
        active
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
      }`}
    >
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
        Sans Obillz
      </span>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                {item.icon}
              </span>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function WithObillzMockup({ active }: { active: boolean }) {
  const nav = ["Dashboard", "Membres", "Cotisations", "Événements", "Buvette", "Finances"];

  return (
    <div
      className={`absolute inset-0 rounded-2xl border border-[#D8E4FF] bg-white p-4 shadow-lg transition-all duration-500 md:p-5 ${
        active
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
      }`}
    >
      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        Avec Obillz
      </span>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[145px_1fr] bg-white">
          <aside className="border-r border-slate-200 bg-[#F8FAFF] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Obillz</p>
            <nav className="mt-3 space-y-1.5">
              {nav.map((item, index) => (
                <div
                  key={item}
                  className={`rounded-lg px-2.5 py-1.5 text-xs ${
                    index === 0
                      ? "bg-[#2563EB] font-semibold text-white"
                      : "text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  {item}
                </div>
              ))}
            </nav>
          </aside>
          <div className="p-4">
            <p className="text-sm font-semibold text-slate-900">Bienvenue au club 👋</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="h-16 rounded-lg bg-slate-100" />
              <div className="h-16 rounded-lg bg-blue-50" />
              <div className="col-span-2 h-20 rounded-lg bg-slate-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentPanel({ mode }: { mode: ComparisonMode }) {
  return (
    <div className="relative min-h-[320px]">
      {(["without", "with"] as const).map((state) => {
        const isActive = state === mode;
        const content = comparisonContent[state];
        return (
          <div
            key={state}
            className={`absolute inset-0 transition-all duration-500 ${
              isActive
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-2 scale-[0.99] opacity-0"
            }`}
          >
            <p className="text-lg font-medium text-slate-700">{content.subtitle}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {content.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#2563EB]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function ComparisonSection() {
  const [mode, setMode] = useState<ComparisonMode>("with");

  return (
    <section className="mx-auto mt-24 w-full max-w-[1200px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="relative min-h-[420px] md:min-h-[440px]">
          <WithoutObillzMockup active={mode === "without"} />
          <WithObillzMockup active={mode === "with"} />
        </div>

        <div>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-[-0.02em] text-slate-950 md:text-5xl">
            Une seule plateforme pour tout <HighlightWord>centraliser</HighlightWord>
          </h2>

          <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMode("without")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "without"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              ❌ Sans Obillz
            </button>
            <button
              type="button"
              onClick={() => setMode("with")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "with"
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              ✅ Avec Obillz
            </button>
          </div>

          <div className="mt-7">
            <ContentPanel mode={mode} />
          </div>
        </div>
      </div>
    </section>
  );
}
