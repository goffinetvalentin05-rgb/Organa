"use client";

import { useState } from "react";
import {
  Calendar2,
  CheckCircle,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  Users,
  Wallet,
} from "@/lib/icons";

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
      icon: FileText,
    },
    {
      title: "Gestion manuelle des paiements",
      description: "Relances et vérification des cotisations à la main.",
      icon: CreditCard,
    },
    {
      title: "Messages WhatsApp des joueurs",
      description: "Informations perdues entre les conversations.",
      icon: Mail,
    },
    {
      title: "Organisation des événements à la main",
      description: "Bénévoles et planning gérés sans outil central.",
      icon: Calendar2,
    },
  ];

  return (
    <div
      className={`absolute inset-0 rounded-[1.35rem] border border-slate-200/90 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-500 md:p-6 ${
        active
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-[0.985] opacity-0"
      }`}
    >
      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
        Sans Obillz
      </span>
      <div className="mt-5 space-y-3.5">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-start gap-3.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                <item.icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
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
  const navIcons = [LayoutDashboard, Users, CreditCard, Calendar2, Mail, Wallet];

  return (
    <div
      className={`absolute inset-0 rounded-[1.35rem] border border-[#D8E4FF] bg-white/92 p-4 shadow-[0_16px_40px_rgba(37,99,235,0.15)] backdrop-blur-sm transition-all duration-500 md:p-5 ${
        active
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-[0.985] opacity-0"
      }`}
    >
      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
        Avec Obillz
      </span>
      <div className="mt-4 overflow-hidden rounded-[1.05rem] border border-slate-200 bg-white">
        <div className="grid min-h-[325px] grid-cols-[170px_1fr] bg-white">
          <aside className="border-r border-slate-200 bg-[#F7FAFF] p-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">Obillz</p>
            <nav className="mt-3.5 space-y-1.5">
              {nav.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${
                    index === 0
                      ? "bg-[#2563EB] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.35)]"
                      : "text-slate-600"
                  }`}
                >
                  {(() => {
                    const Icon = navIcons[index];
                    return (
                      <Icon className={`h-4 w-4 ${index === 0 ? "text-white" : "text-slate-500"}`} />
                    );
                  })()}
                  {item}
                </div>
              ))}
            </nav>
          </aside>
          <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-[18px] md:p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Bienvenue au club 👋</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                En ligne
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <p className="text-[10px] text-slate-500">Membres</p>
                <p className="mt-1 text-base font-bold text-slate-900">284</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-2.5 shadow-sm">
                <p className="text-[10px] text-slate-500">Cotisations</p>
                <p className="mt-1 text-base font-bold text-[#2563EB]">92%</p>
              </div>
              <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[72%] rounded-full bg-[#2563EB]" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-md bg-slate-50" />
                  <div className="h-12 rounded-md bg-slate-50" />
                  <div className="h-12 rounded-md bg-slate-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentPanel({ mode }: { mode: ComparisonMode }) {
  return (
    <div className="relative min-h-[360px]">
      {(["without", "with"] as const).map((state) => {
        const isActive = state === mode;
        const content = comparisonContent[state];
        return (
          <div
            key={state}
            className={`absolute inset-0 transition-all duration-500 ${
              isActive
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-3 scale-[0.99] opacity-0"
            }`}
          >
            <p className="text-xl font-medium text-slate-700">{content.subtitle}</p>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {content.bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                  <span className="mt-0.5 inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle className="h-[18px] w-[18px]" />
                  </span>
                  <span className="pt-0.5">{item}</span>
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
    <section className="relative mx-auto mt-20 w-full max-w-[1200px]">
      <div className="pointer-events-none absolute -left-24 top-6 h-52 w-52 rounded-full bg-blue-100/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-blue-100/45 blur-3xl" />

      <div className="relative grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="relative min-h-[420px] md:min-h-[440px]">
          <WithoutObillzMockup active={mode === "without"} />
          <WithObillzMockup active={mode === "with"} />
        </div>

        <div>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] text-slate-950 md:text-[3.35rem]">
            Une seule plateforme pour tout <HighlightWord>centraliser</HighlightWord>
          </h2>

          <div className="mt-7 inline-flex rounded-full border border-slate-200/90 bg-slate-100/90 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(15,23,42,0.07)]">
            <button
              type="button"
              onClick={() => setMode("without")}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                mode === "without"
                  ? "bg-white text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sans Obillz
            </button>
            <button
              type="button"
              onClick={() => setMode("with")}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                mode === "with"
                  ? "bg-white text-[#2563EB] shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Avec Obillz
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
