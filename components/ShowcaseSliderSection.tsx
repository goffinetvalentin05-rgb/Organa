"use client";

import Link from "next/link";
import { useRef, type ComponentType } from "react";
import { Calendar2, CreditCard, FileText, Mail, QrCode, Receipt, Users, Wallet } from "@/lib/icons";

type SlideCard = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
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
    <article className="group min-h-[260px] min-w-[300px] snap-start rounded-xl border border-slate-200/90 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:min-h-[280px] md:min-w-[360px] md:p-6">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[#2563EB]">
        <card.icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{card.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.description}</p>
      <div className="mt-6 h-1.5 w-20 rounded-full bg-blue-100 transition-all duration-300 group-hover:w-28 group-hover:bg-blue-200" />
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
      id: "members",
      title: "Gestion des membres",
      description:
        "Ajoutez, modifiez et suivez facilement tous les membres de votre club depuis un seul endroit.",
      icon: Users,
    },
    {
      id: "fees",
      title: "Cotisations simplifiées",
      description:
        "Créez et suivez les cotisations en quelques clics. Obillz vous aide à garder une vision claire des paiements.",
      icon: CreditCard,
    },
    {
      id: "invoices",
      title: "Facturation automatique",
      description:
        "Générez des factures pour sponsors, locations ou événements directement depuis la plateforme.",
      icon: Receipt,
    },
    {
      id: "events",
      title: "Organisation des événements",
      description:
        "Planifiez les événements du club et gardez une vue claire sur les activités à venir.",
      icon: Calendar2,
    },
    {
      id: "snackbar",
      title: "Gestion de la buvette",
      description:
        "Créez un planning de réservation pour votre buvette. Partagez un lien de réservation sur votre site ou vos réseaux afin que les personnes puissent réserver facilement un créneau. Toutes les réservations sont centralisées automatiquement dans votre planning.",
      icon: Wallet,
    },
    {
      id: "qrcode",
      title: "QR codes d'inscription",
      description:
        "Générez des QR codes ou des liens d'inscription pour vos événements. Partagez-les facilement sur des flyers, emails ou réseaux sociaux afin de permettre aux participants de s'inscrire rapidement. Toutes les inscriptions sont automatiquement enregistrées dans votre espace.",
      icon: QrCode,
    },
    {
      id: "marketing",
      title: "Campagnes marketing",
      description:
        "Envoyez des communications ciblées à vos membres pour annoncer événements, informations ou nouveautés. Les inscriptions et réservations permettent également de collecter automatiquement les données des participants pour mieux communiquer avec eux.",
      icon: Mail,
    },
    {
      id: "finances",
      title: "Finances du club",
      description:
        "Visualisez simplement les revenus, charges et le solde global du club.",
      icon: FileText,
    },
  ];

  return (
    <section className="mx-auto mt-20 w-full max-w-[1200px]">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] text-slate-900 md:text-[3.15rem]">
            Gérez votre club plus simplement en tout <HighlightWord>centralisant</HighlightWord>
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
            Obillz centralise tout ce dont votre comité a besoin pour gérer un club sportif.
          </p>
          <Link
            href="/inscription"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.45)] transition hover:-translate-y-0.5"
          >
            Découvrir toutes les fonctionnalités
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Carte précédente"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Carte suivante"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
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
