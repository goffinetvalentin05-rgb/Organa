"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  Coffee,
  Globe,
  Handshake,
  LayoutDashboard,
  Plus,
  QrCode,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FeatureMockId =
  | "membres"
  | "cotisations"
  | "factures"
  | "sponsoring"
  | "evenements"
  | "buvette"
  | "finances"
  | "inscriptions"
  | "page-publique";

type MockProps = { compact?: boolean };

function MockShell({
  title,
  subtitle,
  children,
  compact,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/25 bg-white shadow-[0_24px_56px_rgba(2,6,23,0.28)] ${
        compact ? "text-[10px]" : ""
      }`}
    >
      <div className={`border-b border-slate-100 bg-slate-50/95 ${compact ? "px-3 py-2.5" : "px-4 py-3.5"}`}>
        <p className={`font-black text-slate-900 ${compact ? "text-xs" : "text-sm md:text-base"}`}>{title}</p>
        {subtitle ? (
          <p className={`text-slate-500 ${compact ? "mt-0.5 text-[9px]" : "mt-0.5 text-xs"}`}>{subtitle}</p>
        ) : null}
      </div>
      <div className={compact ? "p-3" : "p-4 md:p-5"}>{children}</div>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  accent,
  compact,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border ${compact ? "p-2" : "p-3"} ${
        accent ? "border-[#1A23FF]/25 bg-[#1A23FF]/[0.06]" : "border-slate-200 bg-slate-50/90"
      }`}
    >
      <p className={`font-semibold text-slate-500 ${compact ? "text-[8px]" : "text-[10px]"}`}>{label}</p>
      <p className={`font-black tabular-nums text-slate-900 ${compact ? "mt-0.5 text-sm" : "mt-1 text-lg"}`}>
        {value}
      </p>
      {sub ? (
        <p className={`text-slate-500 ${compact ? "mt-0.5 text-[8px]" : "mt-0.5 text-[10px]"}`}>{sub}</p>
      ) : null}
    </div>
  );
}

export function DashboardMock({ compact }: MockProps) {
  return (
    <MockShell title="Dashboard du club" subtitle="Vue d'ensemble en temps réel" compact={compact}>
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        <StatCell label="Membres" value="284" sub="+12 ce mois" compact={compact} />
        <StatCell label="Cotisations" value="92%" sub="8% en attente" compact={compact} />
        <StatCell label="Factures" value="4" sub="À relancer" compact={compact} />
        <StatCell label="Solde" value="À jour" sub="Consolidé" accent compact={compact} />
      </div>
      <div className={`mt-3 flex flex-wrap gap-2 ${compact ? "mt-2" : ""}`}>
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-800">
          <Plus className="h-3 w-3 text-[#1A23FF]" strokeWidth={2.5} />
          Cotisation
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-800">
          <Plus className="h-3 w-3 text-[#1A23FF]" strokeWidth={2.5} />
          Facture
        </span>
      </div>
    </MockShell>
  );
}

function ListMock({
  title,
  subtitle,
  rows,
  compact,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ primary: string; secondary: string; badge?: string; badgeTone?: "amber" | "emerald" }>;
  compact?: boolean;
}) {
  return (
    <MockShell title={title} subtitle={subtitle} compact={compact}>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.primary}
            className={`flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 ${
              compact ? "px-2 py-2" : "px-3 py-2.5"
            }`}
          >
            <div className="min-w-0">
              <p className={`truncate font-bold text-slate-900 ${compact ? "text-[10px]" : "text-xs"}`}>
                {row.primary}
              </p>
              <p className={`truncate text-slate-500 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                {row.secondary}
              </p>
            </div>
            {row.badge ? (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  row.badgeTone === "emerald"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {row.badge}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </MockShell>
  );
}

export const featureMocks: Record<
  FeatureMockId,
  { icon: LucideIcon; render: (props: MockProps) => ReactNode }
> = {
  membres: {
    icon: Users,
    render: (p) => (
      <ListMock
        {...p}
        title="Membres"
        subtitle="Fiches et équipes centralisées"
        rows={[
          { primary: "Martin L.", secondary: "Équipe 1 · Cotisation payée", badge: "Payé", badgeTone: "emerald" },
          { primary: "Dupont A.", secondary: "Équipe 2 · En attente", badge: "À relancer", badgeTone: "amber" },
          { primary: "Bernard K.", secondary: "Junior · Nouveau membre", badge: "Nouveau" },
        ]}
      />
    ),
  },
  cotisations: {
    icon: Wallet,
    render: (p) => (
      <ListMock
        {...p}
        title="Cotisations"
        subtitle="Envoi et suivi automatiques"
        rows={[
          { primary: "Saison 2025–26", secondary: "48 membres · Envoyé", badge: "92%", badgeTone: "emerald" },
          { primary: "Équipe 2", secondary: "12 en attente", badge: "Relancer", badgeTone: "amber" },
        ]}
      />
    ),
  },
  factures: {
    icon: Receipt,
    render: (p) => (
      <ListMock
        {...p}
        title="Factures"
        subtitle="Création et envoi par email"
        rows={[
          { primary: "Facture #2026-003", secondary: "Buvette · CHF 420", badge: "En attente", badgeTone: "amber" },
          { primary: "Facture #2026-002", secondary: "Sponsor local", badge: "Payée", badgeTone: "emerald" },
        ]}
      />
    ),
  },
  sponsoring: {
    icon: Handshake,
    render: (p) => (
      <ListMock
        {...p}
        title="Sponsoring"
        subtitle="Partenariats et paiements"
        rows={[
          { primary: "Partenaire local", secondary: "CHF 2'500 · Saison", badge: "Actif", badgeTone: "emerald" },
          { primary: "Buvette match", secondary: "CHF 800 · À facturer", badge: "Suivi", badgeTone: "amber" },
        ]}
      />
    ),
  },
  evenements: {
    icon: CalendarDays,
    render: (p) => (
      <ListMock
        {...p}
        title="Événements"
        subtitle="Bénévoles et inscriptions"
        rows={[
          { primary: "Soirée du club", secondary: "8 bénévoles confirmés", badge: "Complet", badgeTone: "emerald" },
          { primary: "Tournoi U15", secondary: "3 places restantes", badge: "Ouvert" },
        ]}
      />
    ),
  },
  buvette: {
    icon: Coffee,
    render: (p) => (
      <ListMock
        {...p}
        title="Buvette"
        subtitle="Réservations et facturation"
        rows={[
          { primary: "Samedi 14h–18h", secondary: "Réservation confirmée", badge: "Validé", badgeTone: "emerald" },
          { primary: "Dimanche match", secondary: "Créneau libre", badge: "Disponible" },
        ]}
      />
    ),
  },
  finances: {
    icon: LayoutDashboard,
    render: (p) => <DashboardMock compact={p.compact} />,
  },
  inscriptions: {
    icon: QrCode,
    render: (p) => (
      <MockShell title="Inscriptions" subtitle="Lien ou QR code partagé" compact={p.compact}>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[#1A23FF]/40 bg-[#1A23FF]/[0.06]">
            <QrCode className="h-10 w-10 text-[#1A23FF]" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <p className="text-xs font-bold text-slate-900">Repas après match</p>
            <p className="text-[10px] text-slate-500">42 participants inscrits</p>
            <p className="truncate rounded-lg bg-slate-100 px-2 py-1.5 font-mono text-[9px] text-slate-600">
              obillz.com/p/club-inscription
            </p>
          </div>
        </div>
      </MockShell>
    ),
  },
  "page-publique": {
    icon: Globe,
    render: (p) => (
      <MockShell title="Page publique du club" subtitle="Liens, programme, buvette" compact={p.compact}>
        <div className="space-y-2">
          {["Programme des matchs", "Inscription événement", "Buvette en ligne"].map((link) => (
            <div
              key={link}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            >
              <span className={`font-semibold text-slate-800 ${p.compact ? "text-[10px]" : "text-xs"}`}>
                {link}
              </span>
              <span className="text-[9px] font-bold text-[#1A23FF]">Ouvrir →</span>
            </div>
          ))}
        </div>
      </MockShell>
    ),
  },
};
