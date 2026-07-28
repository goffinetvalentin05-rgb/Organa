"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  CreditCard,
  FilePlus,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  QrCode,
  Send,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { easePremium } from "@/components/landing/landing-motion";

function MockShell({ children }: { children: ReactNode }) {
  return (
    <div className="features-orbit-mock">
      <div className="features-orbit-mock__chrome" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="features-orbit-mock__body">{children}</div>
    </div>
  );
}

export function CotisationsMock() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setStep(3);
      return;
    }
    setStep(0);
    const timers = [
      window.setTimeout(() => setStep(1), 700),
      window.setTimeout(() => setStep(2), 1600),
      window.setTimeout(() => setStep(3), 2400),
    ];
    const loop = window.setInterval(() => {
      setStep(0);
      window.setTimeout(() => setStep(1), 700);
      window.setTimeout(() => setStep(2), 1600);
      window.setTimeout(() => setStep(3), 2400);
    }, 4200);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [reduceMotion]);

  return (
    <MockShell>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-800">Cotisation 2026</p>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-[#2563eb]">
          CHF 120
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {[
          { name: "148 membres", done: step >= 1 },
          { name: "Montant & échéance", done: step >= 2 },
          { name: "Envoi automatique", done: step >= 3 },
        ].map((row) => (
          <motion.div
            key={row.name}
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[10px] font-medium ${
              row.done
                ? "border-blue-200 bg-blue-50/80 text-slate-800"
                : "border-slate-100 bg-slate-50/80 text-slate-500"
            }`}
            animate={row.done && !reduceMotion ? { scale: [1, 1.02, 1] } : undefined}
            transition={{ duration: 0.35, ease: easePremium }}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                row.done ? "bg-[#1A23FF] text-white" : "bg-white text-slate-300"
              }`}
            >
              {row.done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
            </span>
            {row.name}
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {step >= 3 ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A23FF] to-[#2563EB] px-3 py-2.5 text-[10px] font-semibold text-white shadow-[0_12px_28px_rgba(26,35,255,0.35)]"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2.2} />
            148 cotisations envoyées
          </motion.div>
        ) : null}
      </AnimatePresence>
    </MockShell>
  );
}

export function PlanningsMock() {
  const reduceMotion = useReducedMotion();
  const [filled, setFilled] = useState(0);
  const slots = [
    { label: "Sam 09:00 · Entrée", name: "Léa M." },
    { label: "Sam 11:00 · Buvette", name: "Marc D." },
    { label: "Sam 14:00 · Parking", name: "Nina R." },
    { label: "Dim 10:00 · Caisse", name: "Paul K." },
  ];

  useEffect(() => {
    if (reduceMotion) {
      setFilled(slots.length);
      return;
    }
    setFilled(0);
    let i = 0;
    const tick = () => {
      i = (i % slots.length) + 1;
      setFilled(i);
      if (i === slots.length) {
        window.setTimeout(() => {
          setFilled(0);
          i = 0;
        }, 1200);
      }
    };
    const id = window.setInterval(tick, 900);
    const first = window.setTimeout(tick, 400);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, [reduceMotion, slots.length]);

  return (
    <MockShell>
      <p className="text-[11px] font-semibold text-slate-800">Match du dimanche</p>
      <div className="mt-3 space-y-1.5">
        {slots.map((slot, index) => {
          const isFilled = index < filled;
          return (
            <motion.div
              key={slot.label}
              className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 ${
                isFilled ? "border-emerald-200/80 bg-emerald-50/70" : "border-slate-100 bg-white"
              }`}
              animate={
                isFilled && !reduceMotion ? { scale: [1, 1.03, 1] } : { opacity: 0.85 }
              }
              transition={{ duration: 0.4, ease: easePremium }}
            >
              <span className="text-[9px] font-medium text-slate-600">{slot.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  isFilled
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isFilled ? slot.name : "Libre"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </MockShell>
  );
}

export function MembresMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">Base membres</p>
      </div>
      <div className="mt-3 space-y-2">
        {[
          { initials: "AM", name: "Alice Martin", tag: "Active" },
          { initials: "JD", name: "Jules Dupont", tag: "Junior" },
          { initials: "SB", name: "Sara Brun", tag: "Comité" },
        ].map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: easePremium }}
            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-2.5 py-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#1A23FF] to-[#38BDF8] text-[9px] font-bold text-white">
              {m.initials}
            </span>
            <span className="flex-1 text-[10px] font-medium text-slate-700">{m.name}</span>
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold text-[#2563eb]">
              {m.tag}
            </span>
          </motion.div>
        ))}
      </div>
    </MockShell>
  );
}

export function SponsorsMock() {
  return (
    <MockShell>
      <p className="text-[11px] font-semibold text-slate-800">Partenaires</p>
      <div className="mt-3 space-y-2">
        {[
          { name: "Banque Locale", status: "Actif", amount: "CHF 5'000" },
          { name: "Garage Dupont", status: "À renouveler", amount: "CHF 2'500" },
        ].map((s) => (
          <div key={s.name} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-slate-800">{s.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                  s.status === "Actif"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {s.status}
              </span>
            </div>
            <p className="mt-1 text-[9px] text-slate-500">{s.amount} · saison</p>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

export function EvenementsMock() {
  return (
    <MockShell>
      <p className="text-[11px] font-semibold text-slate-800">Tournoi d&apos;été</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { label: "Inscriptions", value: "86" },
          { label: "Équipes", value: "12" },
          { label: "Bénévoles", value: "24" },
          { label: "Places", value: "92%" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-blue-50/40 px-2.5 py-2.5 text-center"
          >
            <p className="text-sm font-bold tracking-tight text-slate-900">{stat.value}</p>
            <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

export function StatistiquesMock() {
  const bars = [42, 68, 55, 82, 74, 90];
  return (
    <MockShell>
      <p className="text-[11px] font-semibold text-slate-800">Dashboard club</p>
      <div className="mt-4 flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-[#1A23FF] to-[#60A5FA]"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.08, duration: 0.55, ease: easePremium }}
          />
        ))}
      </div>
      <p className="mt-2 text-[9px] text-slate-500">Vue d&apos;ensemble · saison</p>
    </MockShell>
  );
}

function StatusListMock({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; status: string; tone?: "ok" | "warn" | "info" }>;
}) {
  return (
    <MockShell>
      <p className="text-[11px] font-semibold text-slate-800">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-2.5 py-2"
          >
            <span className="text-[10px] font-medium text-slate-700">{row.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                row.tone === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : row.tone === "warn"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-[#2563eb]"
              }`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

export function FacturesMock() {
  return (
    <StatusListMock
      title="Factures"
      rows={[
        { label: "FAC-2026-014", status: "Payée", tone: "ok" },
        { label: "FAC-2026-015", status: "Envoyée", tone: "info" },
        { label: "FAC-2026-016", status: "Brouillon", tone: "warn" },
      ]}
    />
  );
}

export function EncaissementsMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <CreditCard className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">Encaissements</p>
      </div>
      <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">CHF 8&apos;420</p>
      <p className="text-[9px] text-slate-500">30 derniers jours</p>
      <div className="mt-3 flex gap-1.5">
        {["Cotisations", "Buvette", "Événements"].map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-semibold text-[#2563eb]"
          >
            {chip}
          </span>
        ))}
      </div>
    </MockShell>
  );
}

export function RevenusMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">Produits & revenus</p>
      </div>
      <div className="mt-3 space-y-2">
        {[
          { name: "Maillots", value: "CHF 1'240" },
          { name: "Tombola", value: "CHF 680" },
          { name: "Repas", value: "CHF 920" },
        ].map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-2.5 py-2"
          >
            <span className="text-[10px] font-medium text-slate-700">{p.name}</span>
            <span className="text-[10px] font-bold text-slate-900">{p.value}</span>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

export function ChargesMock() {
  return (
    <StatusListMock
      title="Charges"
      rows={[
        { label: "Matériel", status: "Payé", tone: "ok" },
        { label: "Déplacements", status: "À valider", tone: "warn" },
        { label: "Licences", status: "Payé", tone: "ok" },
      ]}
    />
  );
}

export function BuvetteMock() {
  return (
    <StatusListMock
      title="Buvette"
      rows={[
        { label: "Sam 14:00", status: "Réservé", tone: "ok" },
        { label: "Dim 10:00", status: "Libre", tone: "info" },
        { label: "Dim 16:00", status: "En attente", tone: "warn" },
      ]}
    />
  );
}

export function PvMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <FilePlus className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">PV de séance</p>
      </div>
      <div className="mt-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
        <p className="text-[10px] font-semibold text-slate-800">Comité · 12 mars 2026</p>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
          Ordre du jour, décisions et actions — PDF prêt à partager.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[9px] font-semibold text-[#2563eb]">
        <FileText className="h-3 w-3" />
        Export PDF disponible
      </div>
    </MockShell>
  );
}

export function QrCodesMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <QrCode className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">QR Codes</p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-[1px] ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-800">Inscription repas</p>
          <p className="mt-1 text-[9px] text-slate-500">Scannez pour s&apos;inscrire</p>
        </div>
      </div>
    </MockShell>
  );
}

export function CommunicationMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">Campagne</p>
      </div>
      <div className="mt-3 space-y-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-slate-800">Rappel cotisation</p>
          <p className="mt-1 text-[9px] text-slate-500">Envoyée à 86 membres</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-semibold text-emerald-700">
          <Check className="h-3 w-3" strokeWidth={2.5} />
          Ouverture 64%
        </div>
      </div>
    </MockShell>
  );
}

export function PagePubliqueMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <Globe className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">Page publique</p>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
        <div className="bg-gradient-to-r from-[#1A23FF] to-[#3B82F6] px-3 py-4 text-center">
          <p className="text-[10px] font-bold text-white">FC Les Étoiles</p>
          <p className="mt-0.5 text-[8px] text-blue-100">Programme · Buvette · Inscriptions</p>
        </div>
        <div className="bg-white px-3 py-2 text-[9px] text-slate-500">obillz.app/p/fc-etoiles</div>
      </div>
    </MockShell>
  );
}

export function ParametresMock() {
  return (
    <StatusListMock
      title="Paramètres"
      rows={[
        { label: "Président", status: "Accès complet", tone: "info" },
        { label: "Trésorier", status: "Finances", tone: "ok" },
        { label: "Secrétaire", status: "Documents", tone: "ok" },
      ]}
    />
  );
}

export function GenericMock() {
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        <FolderOpen className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={2.2} />
        <p className="text-[11px] font-semibold text-slate-800">Aperçu Obillz</p>
      </div>
      <div className="mt-3 space-y-2">
        {["Simple", "Centralisé", "Gain de temps"].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 text-[10px] font-medium text-slate-700"
          >
            <Check className="h-3.5 w-3.5 text-[#1A23FF]" strokeWidth={2.5} />
            {item}
          </div>
        ))}
      </div>
    </MockShell>
  );
}

export const featureOrbitMocks: Record<string, () => ReactNode> = {
  statistiques: () => <StatistiquesMock />,
  membres: () => <MembresMock />,
  cotisations: () => <CotisationsMock />,
  factures: () => <FacturesMock />,
  encaissements: () => <EncaissementsMock />,
  revenus: () => <RevenusMock />,
  charges: () => <ChargesMock />,
  sponsors: () => <SponsorsMock />,
  evenements: () => <EvenementsMock />,
  buvette: () => <BuvetteMock />,
  plannings: () => <PlanningsMock />,
  pv: () => <PvMock />,
  qrcodes: () => <QrCodesMock />,
  communication: () => <CommunicationMock />,
  pagePublique: () => <PagePubliqueMock />,
  parametres: () => <ParametresMock />,
  generic: () => <GenericMock />,
};
