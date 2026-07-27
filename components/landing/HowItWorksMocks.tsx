"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  FileText,
  ImagePlus,
  MapPin,
  Shield,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";

type MockLabels = {
  step1: {
    title: string;
    clubName: string;
    clubNameValue: string;
    sport: string;
    sportValue: string;
    location: string;
    locationValue: string;
    logo: string;
    cta: string;
  };
  step2: {
    title: string;
    fileName: string;
    uploadHint: string;
    importing: string;
    success: string;
  };
  step3: {
    title: string;
    president: string;
    treasurer: string;
    secretary: string;
    fullAccess: string;
    financeAccess: string;
    adminAccess: string;
  };
  step4: {
    title: string;
    members: string;
    membersCount: string;
    cotisations: string;
    cotisationsStatus: string;
    documents: string;
    documentsCount: string;
    events: string;
    eventsCount: string;
    centralized: string;
  };
};

function MockShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-[0_32px_64px_-20px_rgba(15,23,42,0.14),0_0_0_1px_rgba(15,23,42,0.03)] sm:p-6 md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">
      {children}
    </p>
  );
}

function FieldInput({
  value,
  icon,
}: {
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:py-3">
      {icon ? <span className="how-it-works-blue-icon shrink-0">{icon}</span> : null}
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function ClubCreationMock({ labels }: { labels: MockLabels["step1"] }) {
  return (
    <MockShell>
      <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{labels.title}</p>
      <div className="mt-5 space-y-4">
        <div>
          <FieldLabel>{labels.clubName}</FieldLabel>
          <FieldInput value={labels.clubNameValue} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>{labels.sport}</FieldLabel>
            <FieldInput value={labels.sportValue} />
          </div>
          <div>
            <FieldLabel>{labels.location}</FieldLabel>
            <FieldInput
              value={labels.locationValue}
              icon={<MapPin className="h-4 w-4" strokeWidth={2} />}
            />
          </div>
        </div>
        <div>
          <FieldLabel>{labels.logo}</FieldLabel>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3">
            <span className="how-it-works-blue-soft flex h-11 w-11 items-center justify-center rounded-xl">
              <ImagePlus className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-sm text-slate-500">PNG, JPG · max 2 MB</span>
          </div>
        </div>
        <button
          type="button"
          className="how-it-works-blue-fill mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
        >
          {labels.cta}
        </button>
      </div>
    </MockShell>
  );
}

export function MemberImportMock({
  labels,
  active,
}: {
  labels: MockLabels["step2"];
  active: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"upload" | "loading" | "done">("upload");

  useEffect(() => {
    if (!active) {
      setPhase("upload");
      return;
    }
    if (reduceMotion) {
      setPhase("done");
      return;
    }
    setPhase("loading");
    const t1 = window.setTimeout(() => setPhase("done"), 1400);
    return () => window.clearTimeout(t1);
  }, [active, reduceMotion]);

  return (
    <MockShell>
      <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{labels.title}</p>
      <div className="mt-5">
        <AnimatePresence mode="wait">
          {phase === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easePremium }}
              className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center"
            >
              <span className="how-it-works-blue-soft mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
                <Upload className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800">{labels.fileName}</p>
              <p className="mt-1 text-xs text-slate-500">{labels.uploadHint}</p>
            </motion.div>
          ) : null}

          {phase === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easePremium }}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
            >
              <motion.span
                className="how-it-works-blue-ring mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
              <p className="mt-4 text-sm font-medium text-slate-600">{labels.importing}</p>
            </motion.div>
          ) : null}

          {phase === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: easePremium }}
              className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 text-center"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]">
                <Check className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <p className="mt-4 text-lg font-bold text-emerald-800">{labels.success}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["MD", "CL", "SR", "AB", "PK"].map((initials) => (
                  <span
                    key={initials}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/80"
                  >
                    {initials}
                  </span>
                ))}
                <span className="how-it-works-blue-fill flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  +243
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MockShell>
  );
}

function RoleBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "blue" | "emerald" | "amber";
}) {
  const styles = {
    blue: "how-it-works-blue-soft border",
    emerald: "bg-emerald-500/[0.1] text-emerald-700 border-emerald-500/20",
    amber: "bg-amber-500/[0.1] text-amber-700 border-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[variant]}`}>
      <Shield className="h-3 w-3" strokeWidth={2.5} />
      {children}
    </span>
  );
}

export function CommitteeMock({ labels }: { labels: MockLabels["step3"] }) {
  const members = [
    { name: labels.president, role: labels.fullAccess, initials: "PD", gradient: "from-[#37b9ed] to-[#175dd4]", badge: "blue" as const },
    { name: labels.treasurer, role: labels.financeAccess, initials: "TR", gradient: "from-emerald-500 to-teal-500", badge: "emerald" as const },
    { name: labels.secretary, role: labels.adminAccess, initials: "SC", gradient: "from-amber-500 to-orange-500", badge: "amber" as const },
  ];

  return (
    <MockShell>
      <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{labels.title}</p>
      <ul className="mt-5 space-y-3">
        {members.map((member) => (
          <li
            key={member.name}
            className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:px-4"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.gradient} text-xs font-bold text-white shadow-md`}
            >
              {member.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{member.name}</p>
              <RoleBadge variant={member.badge}>{member.role}</RoleBadge>
            </div>
          </li>
        ))}
      </ul>
    </MockShell>
  );
}

export function CentralizedMock({ labels }: { labels: MockLabels["step4"] }) {
  const tiles = [
    { icon: Users, label: labels.members, value: labels.membersCount, color: "how-it-works-blue-icon", bg: "how-it-works-blue-soft" },
    { icon: Wallet, label: labels.cotisations, value: labels.cotisationsStatus, color: "text-emerald-600", bg: "bg-emerald-500/[0.08]" },
    { icon: FileText, label: labels.documents, value: labels.documentsCount, color: "text-violet-600", bg: "bg-violet-500/[0.08]" },
    { icon: CalendarDays, label: labels.events, value: labels.eventsCount, color: "text-sky-600", bg: "bg-sky-500/[0.08]" },
  ];

  return (
    <MockShell>
      <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{labels.title}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-4"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile.bg} ${tile.color}`}>
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{tile.label}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">{tile.value}</p>
            </div>
          );
        })}
      </div>
      <div className="how-it-works-blue-soft mt-4 flex items-center justify-center gap-2 rounded-xl border px-4 py-3">
        <span className="how-it-works-blue-fill flex h-6 w-6 items-center justify-center rounded-full text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <p className="how-it-works-blue-icon text-sm font-semibold">{labels.centralized}</p>
      </div>
    </MockShell>
  );
}

export type { MockLabels };
